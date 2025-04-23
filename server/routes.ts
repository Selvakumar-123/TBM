import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage"; // Use unified storage interface
import { insertAttendanceSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create attendance record
  app.post("/api/attendance", async (req, res) => {
    try {
      const validatedData = insertAttendanceSchema.parse(req.body);
      const createdRecord = await storage.createAttendanceRecord(validatedData);
      res.status(201).json(createdRecord);
    } catch (error) {
      console.error("Error creating attendance record:", error);
      res.status(400).json({ 
        message: "Invalid attendance record data", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // Get all attendance records
  app.get("/api/attendance", async (req, res) => {
    try {
      const records = await storage.getAttendanceRecords();
      res.json(records);
    } catch (error) {
      console.error("Error fetching attendance records:", error);
      res.status(500).json({ 
        message: "Failed to fetch attendance records",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Get attendance records by date
  app.get("/api/attendance/by-date/:date", async (req, res) => {
    try {
      const { date } = req.params;
      const records = await storage.getAttendanceRecordsByDate(date);
      res.json(records);
    } catch (error) {
      console.error("Error fetching attendance records by date:", error);
      res.status(500).json({ 
        message: "Failed to fetch attendance records by date",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
