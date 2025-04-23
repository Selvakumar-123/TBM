import { attendanceCollection, Timestamp } from './firebase';
import { type AttendanceRecord, type InsertAttendance } from "@shared/schema";
import { addDoc, getDocs, query, orderBy, where, FirestoreError } from 'firebase/firestore';
import { format } from 'date-fns';

// Temporary fallback storage for when Firebase is not connecting
class FallbackMemoryStorage {
  private records: Map<number, AttendanceRecord> = new Map();
  private currentId = 1;
  
  addRecord(record: AttendanceRecord): AttendanceRecord {
    this.records.set(record.id || this.currentId++, record);
    return record;
  }
  
  getAllRecords(): AttendanceRecord[] {
    return Array.from(this.records.values()).sort((a, b) => {
      const dateA = new Date(a.dateTime);
      const dateB = new Date(b.dateTime);
      return dateB.getTime() - dateA.getTime();
    });
  }
  
  getRecordsByDate(date: string): AttendanceRecord[] {
    return this.getAllRecords().filter(record => {
      const recordDate = format(new Date(record.dateTime), 'yyyy-MM-dd');
      return recordDate === date;
    });
  }
  
  // Check if a name already exists for today's date
  hasDuplicateForToday(name: string): boolean {
    const today = format(new Date(), 'yyyy-MM-dd');
    return this.getAllRecords().some(record => {
      const recordDate = format(new Date(record.dateTime), 'yyyy-MM-dd');
      return recordDate === today && record.name.toLowerCase() === name.toLowerCase();
    });
  }
}

// Create singleton instance
const fallbackStorage = new FallbackMemoryStorage();

// Storage interface (same as before)
export interface IStorage {
  createAttendanceRecord(record: InsertAttendance): Promise<AttendanceRecord>;
  getAttendanceRecords(): Promise<AttendanceRecord[]>;
  getAttendanceRecordsByDate(date: string): Promise<AttendanceRecord[]>;
}

// Firebase implementation
export class FirebaseStorage implements IStorage {
  // Check if a user already submitted attendance for today
  async checkDuplicateAttendance(name: string): Promise<boolean> {
    try {
      // Get today's date
      const today = new Date();
      const todayDateStr = format(today, 'yyyy-MM-dd');
      
      // Simpler approach: Get all records and filter in memory to avoid index issues
      const allRecords = await this.getAttendanceRecords();
      
      // Check if there's any record with the same name today
      const duplicateFound = allRecords.some(record => {
        const recordName = record.name.toLowerCase();
        const recordDate = format(new Date(record.dateTime), 'yyyy-MM-dd');
        return recordName === name.toLowerCase() && recordDate === todayDateStr;
      });
      
      return duplicateFound;
    } catch (error) {
      console.error('Error checking for duplicate attendance:', error);
      // Fall back to checking the fallback storage
      try {
        return fallbackStorage.hasDuplicateForToday(name);
      } catch (innerError) {
        console.error('Error checking fallback storage:', innerError);
        // In case of both errors, allow submission to continue
        return false;
      }
    }
  }

  // Create a new attendance record in Firebase
  async createAttendanceRecord(record: InsertAttendance): Promise<AttendanceRecord> {
    const now = new Date();
    const dateTime = record.dateTime || now;
    
    // Check for duplicate entries
    const isDuplicate = await this.checkDuplicateAttendance(record.name);
    if (isDuplicate) {
      throw new Error(`Attendance for ${record.name} is already recorded for today.`);
    }
    
    // Create document data (convert Date to Firestore Timestamp)
    const docData = {
      dateTime: Timestamp.fromDate(new Date(dateTime)),
      name: record.name,
      company: record.company,
      supervisor: record.supervisor,
      signatureData: record.signatureData,
    };
    
    try {
      // Try to add the document to Firestore
      const docRef = await addDoc(attendanceCollection, docData);
      
      // Return the created record
      const newRecord = {
        id: parseInt(docRef.id, 16) || Math.floor(Math.random() * 1000000), // Generate numeric ID from docRef
        dateTime,
        name: record.name,
        company: record.company,
        supervisor: record.supervisor,
        signatureData: record.signatureData,
      };
      
      // Also save to fallback storage
      fallbackStorage.addRecord(newRecord);
      
      return newRecord;
    } catch (error) {
      console.warn('Firebase error, using fallback storage:', error);
      
      // Check for duplicate in fallback storage
      if (fallbackStorage.hasDuplicateForToday(record.name)) {
        throw new Error(`Attendance for ${record.name} is already recorded for today.`);
      }
      
      // Create record with generated ID for fallback storage
      const fallbackRecord = {
        id: Math.floor(Math.random() * 1000000),
        dateTime,
        name: record.name,
        company: record.company,
        supervisor: record.supervisor,
        signatureData: record.signatureData,
      };
      
      // Store in fallback and return
      return fallbackStorage.addRecord(fallbackRecord);
    }
  }

  // Get all attendance records
  async getAttendanceRecords(): Promise<AttendanceRecord[]> {
    try {
      // Create a query with ordering
      const q = query(attendanceCollection, orderBy('dateTime', 'desc'));
      
      // Get the documents
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        console.log('No attendance records found in Firebase, using fallback storage');
        return fallbackStorage.getAllRecords();
      }
      
      // Map the results to our AttendanceRecord type
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        const dateTime = data.dateTime.toDate(); // Convert Timestamp to Date
        
        return {
          id: parseInt(doc.id, 16) || Math.floor(Math.random() * 1000000), // Generate numeric ID from doc.id
          dateTime,
          name: data.name,
          company: data.company,
          supervisor: data.supervisor,
          signatureData: data.signatureData,
        };
      });
    } catch (error) {
      console.warn('Firebase error when fetching records, using fallback storage:', error);
      return fallbackStorage.getAllRecords();
    }
  }

  // Get attendance records for a specific date
  async getAttendanceRecordsByDate(date: string): Promise<AttendanceRecord[]> {
    try {
      // Create start and end date for the query (for the entire day)
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      
      // Create a query with date filtering
      const q = query(
        attendanceCollection,
        where('dateTime', '>=', Timestamp.fromDate(startDate)),
        where('dateTime', '<=', Timestamp.fromDate(endDate)),
        orderBy('dateTime', 'desc')
      );
      
      // Get the documents
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        console.log(`No attendance records found for date ${date} in Firebase, using fallback storage`);
        return fallbackStorage.getRecordsByDate(date);
      }
      
      // Map the results to our AttendanceRecord type
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        const dateTime = data.dateTime.toDate(); // Convert Timestamp to Date
        
        return {
          id: parseInt(doc.id, 16) || Math.floor(Math.random() * 1000000),
          dateTime,
          name: data.name,
          company: data.company,
          supervisor: data.supervisor,
          signatureData: data.signatureData,
        };
      });
    } catch (error) {
      console.warn(`Firebase error when fetching records for date ${date}, using fallback storage:`, error);
      return fallbackStorage.getRecordsByDate(date);
    }
  }
}

// Export a singleton instance
export const firebaseStorage = new FirebaseStorage();
console.log("Using Firebase for storage");