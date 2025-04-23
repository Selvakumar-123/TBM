import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { AttendanceRecord, InsertAttendance } from "@shared/schema";

export function useAttendanceRecords() {
  return useQuery<AttendanceRecord[]>({
    queryKey: ['/api/attendance'],
  });
}

export function useAttendanceRecordsByDate(date: string | null) {
  return useQuery<AttendanceRecord[]>({
    queryKey: ['/api/attendance/by-date', date],
    queryFn: async () => {
      if (!date) return [];
      
      try {
        console.log(`Fetching attendance records for date: ${date}`);
        const response = await fetch(`/api/attendance/by-date/${date}`);
        
        if (!response.ok) {
          const errorData = await response.text();
          console.error('API error response:', errorData);
          throw new Error(`Failed to fetch attendance records by date: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log(`Successfully fetched ${data.length} records for date: ${date}`);
        return data;
      } catch (error) {
        console.error('Error fetching attendance records by date:', error);
        throw error;
      }
    },
    enabled: !!date,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateAttendance() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: InsertAttendance) => {
      const res = await apiRequest('POST', '/api/attendance', data);
      return await res.json();
    },
    onSuccess: (data) => {
      // Invalidate the main attendance query
      queryClient.invalidateQueries({ queryKey: ['/api/attendance'] });
      
      // Also invalidate any date-specific queries
      // Extract the date from the record to invalidate that specific date
      if (data && data.dateTime) {
        const recordDate = new Date(data.dateTime);
        const dateString = recordDate.toISOString().split('T')[0]; // Format: YYYY-MM-DD
        queryClient.invalidateQueries({ 
          queryKey: ['/api/attendance/by-date', dateString] 
        });
      }
    },
  });
}
