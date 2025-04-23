import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  AlertCircle, 
  Search, 
  X, 
  FileSpreadsheet, 
  Download, 
  ChevronDown 
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAttendanceRecords, useAttendanceRecordsByDate } from "@/hooks/use-attendance";
import { formatDateTime, generatePDF, generateExcel } from "@/lib/utils";
import DatePickerModal from "./DatePickerModal";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AttendanceRecords() {
  const { toast } = useToast();
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const { data: allRecords, isLoading: isLoadingAll } = useAttendanceRecords();
  const { data: filteredRecords, isLoading: isLoadingFiltered } = useAttendanceRecordsByDate(selectedDate);
  
  // Filter records based on date first, then apply name search filter
  let records = selectedDate ? filteredRecords : allRecords;
  const isLoading = selectedDate ? isLoadingFiltered : isLoadingAll;
  
  // Apply name search if a query exists
  if (records && searchQuery.trim() !== '') {
    const query = searchQuery.toLowerCase();
    records = records.filter(record => 
      record.name.toLowerCase().includes(query)
    );
  }

  const handleOpenDatePicker = () => {
    setIsDatePickerOpen(true);
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
  };

  const handleGeneratePdf = () => {
    if (!records || records.length === 0) {
      toast({
        title: "No records found",
        description: "There are no attendance records to include in the PDF.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Show toast for starting process
      toast({
        title: "Generating PDF",
        description: "Creating your attendance report, please wait...",
      });
      
      // Create the formatted date string
      const reportDate = selectedDate || new Date().toISOString().split('T')[0];
      
      // Log the operation
      console.log('Generating PDF for date:', reportDate, 'with', records.length, 'records');
      
      // Generate the PDF with the new approach
      generatePDF(records, reportDate);
      
      // Notify user of success
      toast({
        title: "PDF Generated",
        description: "Your attendance report has been downloaded successfully.",
      });
    } catch (error) {
      console.error('PDF Generation Error:', error);
      
      // Create a more detailed error message
      let errorMessage = "An error occurred while generating the PDF.";
      if (error instanceof Error) {
        errorMessage = `Error: ${error.message}`;
        console.error("Error details:", error.stack);
      }
      
      // Show error toast
      toast({
        title: "PDF Generation Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };
  
  const handleGenerateExcel = () => {
    if (!records || records.length === 0) {
      toast({
        title: "No records found",
        description: "There are no attendance records to include in the Excel file.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Show toast for starting process
      toast({
        title: "Generating Excel",
        description: "Creating your attendance spreadsheet, please wait...",
      });
      
      // Create the formatted date string
      const reportDate = selectedDate || new Date().toISOString().split('T')[0];
      
      // Log the operation
      console.log('Generating Excel for date:', reportDate, 'with', records.length, 'records');
      
      // Generate the Excel file
      generateExcel(records, reportDate);
      
      // Notify user of success
      toast({
        title: "Excel Generated",
        description: "Your attendance spreadsheet has been downloaded successfully.",
      });
    } catch (error) {
      console.error('Excel Generation Error:', error);
      
      // Create a more detailed error message
      let errorMessage = "An error occurred while generating the Excel file.";
      if (error instanceof Error) {
        errorMessage = `Error: ${error.message}`;
        console.error("Error details:", error.stack);
      }
      
      // Show error toast
      toast({
        title: "Excel Generation Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <h2 className="text-xl font-semibold">
              {selectedDate 
                ? `Attendance Records for ${selectedDate}` 
                : "Attendance Records"}
            </h2>
            
            <div className="mt-3 sm:mt-0 flex gap-2">
              {selectedDate && (
                <Button
                  variant="outline"
                  onClick={() => setSelectedDate(null)}
                >
                  Clear Filter
                </Button>
              )}
              <Button onClick={handleOpenDatePicker} variant="outline">
                <FileText className="mr-2 h-4 w-4" />
                Select Date
              </Button>
              {records && records.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button>
                      <Download className="mr-2 h-4 w-4" />
                      Export
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={handleGeneratePdf}>
                      <FileText className="mr-2 h-4 w-4" />
                      <span>PDF Document</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleGenerateExcel}>
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      <span>Excel Spreadsheet</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
          
          {/* Search by Name Input */}
          <div className="mb-6 relative">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-8"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-2.5 text-gray-500 hover:text-gray-700"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {searchQuery && records && (
              <p className="text-sm text-gray-500 mt-1">
                {records.length} {records.length === 1 ? 'result' : 'results'} found
              </p>
            )}
          </div>
          
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading attendance records...</p>
            </div>
          ) : !records || records.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-gray-500">No attendance records found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Supervisor & Signature</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record, index) => (
                    <TableRow key={`${record.id}-${index}`}>
                      <TableCell className="whitespace-nowrap text-sm text-gray-500">
                        {formatDateTime(record.dateTime)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm font-medium">
                        {record.name}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-gray-500">
                        {record.company}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <span className="whitespace-nowrap text-sm text-gray-500">{record.supervisor}</span>
                          <img 
                            src={record.signatureData} 
                            alt="Signature" 
                            className="h-10 w-auto object-contain" 
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      <DatePickerModal
        isOpen={isDatePickerOpen}
        onClose={() => setIsDatePickerOpen(false)}
        onDateSelect={handleDateSelect}
      />
    </>
  );
}
