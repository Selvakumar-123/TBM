import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import { jsPDF } from "jspdf";
import 'jspdf-autotable';
import { saveAs } from 'file-saver';
import { utils, write } from 'xlsx';
import { AttendanceRecord } from "@shared/schema";

// Add TypeScript interface for jsPDF with autoTable method
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => any;
    lastAutoTable?: {
      finalY: number;
    };
  }
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format date time for display
export function formatDateTime(date: Date | string): string {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  return format(date, 'yyyy-MM-dd hh:mm a');
}

// Generate Excel file with attendance records
export function generateExcel(records: AttendanceRecord[], date: string): void {
  try {
    console.log("Starting Excel generation");
    
    // Format data for Excel
    const excelData = records.map(record => ({
      'Date & Time': formatDateTime(record.dateTime),
      'Name': record.name,
      'Company': record.company,
      'Supervisor': record.supervisor
      // Note: Signatures are not included in Excel as they are images
    }));
    
    // Create workbook and worksheet
    const worksheet = utils.json_to_sheet(excelData);
    const workbook = utils.book_new();
    
    // Adjust column widths
    const columnWidths = [
      { wch: 20 }, // Date & Time
      { wch: 25 }, // Name
      { wch: 20 }, // Company
      { wch: 20 }, // Supervisor
    ];
    worksheet['!cols'] = columnWidths;
    
    // Add worksheet to workbook
    utils.book_append_sheet(workbook, worksheet, 'Attendance Records');
    
    // Generate the Excel file
    const excelBuffer = write(workbook, { bookType: 'xlsx', type: 'array' });
    
    // Convert to Blob and save
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    // Generate filename and save
    const safeDate = date.replace(/[^a-zA-Z0-9-]/g, '-');
    const filename = `attendance_report_${safeDate}.xlsx`;
    saveAs(blob, filename);
    
    console.log("Excel generated successfully:", filename);
    
  } catch (error) {
    console.error("Excel generation error:", error);
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    throw error;
  }
}

export function generatePDF(records: AttendanceRecord[], date: string): void {
  try {
    console.log("Starting PDF generation with simpler approach");
    
    // Create a basic PDF document
    const doc = new jsPDF();
    
    // Add a title
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text(`Attendance Report - ${date}`, 15, 15);
    
    // Add generation timestamp
    doc.setFontSize(10);
    doc.text(`Generated: ${format(new Date(), 'yyyy-MM-dd hh:mm a')}`, 15, 22);
    
    // Create a basic table manually if autoTable isn't working
    let yPos = 30;
    const lineHeight = 18; // Increased line height to accommodate signatures
    
    // Set up column positions and widths for better layout - adjusted to prevent overlap
    const cols = {
      dateTime: { x: 15, width: 40 },
      name: { x: 55, width: 60 },     // Increased width for name
      company: { x: 115, width: 35 }, // Moved and slightly reduced
      supervisor: { x: 150, width: 25 }, // Moved and reduced
      signature: { x: 175, width: 25 }   // Moved slightly
    };
    
    // Add headers
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 150);
    doc.text("Date & Time", cols.dateTime.x, yPos);
    doc.text("Name", cols.name.x, yPos);
    doc.text("Company", cols.company.x, yPos);
    doc.text("Supervisor", cols.supervisor.x, yPos);
    doc.text("Signature", cols.signature.x, yPos);
    
    // Add a line
    yPos += 2;
    doc.setDrawColor(0, 0, 0);
    doc.line(15, yPos, 195, yPos);
    yPos += lineHeight;
    
    // Add data rows
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    
    records.forEach(record => {
      if (yPos > 270) { // Check if we need a new page
        doc.addPage();
        yPos = 30;
        
        // Add headers on the new page
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 150);
        doc.text("Date & Time", cols.dateTime.x, yPos);
        doc.text("Name", cols.name.x, yPos);
        doc.text("Company", cols.company.x, yPos);
        doc.text("Supervisor", cols.supervisor.x, yPos);
        doc.text("Signature", cols.signature.x, yPos);
        
        // Add a line
        yPos += 2;
        doc.setDrawColor(0, 0, 0);
        doc.line(15, yPos, 195, yPos);
        yPos += lineHeight/2;
        
        // Reset text color for data
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
      }
      
      // Print data using column definitions with truncation for long text
      doc.text(formatDateTime(record.dateTime).substring(0, 16), cols.dateTime.x, yPos);
      
      // Handle potentially long names with truncation if needed
      const nameText = record.name.length > 28 ? record.name.substring(0, 25) + '...' : record.name;
      doc.text(nameText, cols.name.x, yPos);
      
      // Handle potentially long company names
      const companyText = record.company.length > 16 ? record.company.substring(0, 13) + '...' : record.company;
      doc.text(companyText, cols.company.x, yPos);
      
      // Handle potentially long supervisor names
      const supervisorText = record.supervisor.length > 12 ? record.supervisor.substring(0, 10) + '...' : record.supervisor;
      doc.text(supervisorText, cols.supervisor.x, yPos);
      
      // Add signature in the signature column
      if (record.signatureData) {
        try {
          // Position signature in the signature column
          doc.addImage(
            record.signatureData,
            'PNG',
            cols.signature.x,        // Signature column position
            yPos - 10,               // Better vertical alignment for signature
            cols.signature.width,    // Use defined width
            16                       // Slightly taller to show more detail
          );
        } catch (err) {
          console.error("Error adding inline signature:", err);
        }
      }
      
      yPos += lineHeight;
    });
    
    // No separate signatures section - signatures are included in the main table
    
    // Generate filename and save
    const safeDate = date.replace(/[^a-zA-Z0-9-]/g, '-');
    const filename = `attendance_report_${safeDate}.pdf`;
    
    // Save PDF
    const pdfOutput = doc.output('blob');
    saveAs(pdfOutput, filename);
    
    console.log("PDF generated successfully:", filename);
    
  } catch (error) {
    console.error("PDF generation error:", error);
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    throw error;
  }
}


