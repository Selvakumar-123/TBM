import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const attendanceRecords = pgTable("attendance_records", {
  id: serial("id").primaryKey(),
  dateTime: timestamp("date_time").notNull().defaultNow(),
  name: text("name").notNull(),
  company: text("company").notNull(),
  supervisor: text("supervisor").notNull(),
  signatureData: text("signature_data").notNull(),
});

// Create base schema
const baseSchema = createInsertSchema(attendanceRecords).omit({
  id: true,
});

// Create custom schema with dateTime transformation to handle string inputs
export const insertAttendanceSchema = baseSchema.extend({
  dateTime: z.preprocess(
    // Convert string to Date if it's a string
    (val) => {
      if (typeof val === 'string') {
        return new Date(val);
      }
      return val;
    },
    z.date() // Validate as a date
  )
});

export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type AttendanceRecord = typeof attendanceRecords.$inferSelect;
