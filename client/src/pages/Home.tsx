import AttendanceForm from "@/components/AttendanceForm";
import AttendanceRecords from "@/components/AttendanceRecords";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-semibold text-gray-800">Employee Attendance System</h1>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-5 lg:col-span-4">
            <AttendanceForm />
          </div>
          
          <div className="md:col-span-7 lg:col-span-8">
            <AttendanceRecords />
          </div>
        </div>
      </main>
    </div>
  );
}
