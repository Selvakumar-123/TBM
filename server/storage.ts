import { type AttendanceRecord, type InsertAttendance } from "@shared/schema";

// Storage interface
export interface IStorage {
  createAttendanceRecord(record: InsertAttendance): Promise<AttendanceRecord>;
  getAttendanceRecords(): Promise<AttendanceRecord[]>;
  getAttendanceRecordsByDate(date: string): Promise<AttendanceRecord[]>;
}

// Import Firebase storage
import { firebaseStorage } from "./firebase-storage";

// Use Firebase storage 
export const storage = firebaseStorage;
console.log("Using Firebase storage exclusively");