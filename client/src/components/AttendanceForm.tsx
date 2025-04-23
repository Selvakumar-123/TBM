import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertAttendanceSchema } from "@shared/schema";
import { useCreateAttendance } from "@/hooks/use-attendance";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { formatDateTime } from "@/lib/utils";
import SignatureCanvas from "./SignatureCanvas";
import { useToast } from "@/hooks/use-toast";

// Extend the schema with additional validation rules
const formSchema = insertAttendanceSchema.extend({
  name: z.string().min(1, { message: "Name is required" }),
  company: z.string().min(1, { message: "Company selection is required" }),
  supervisor: z.string().min(1, { message: "Supervisor selection is required" }),
  signatureData: z.string().min(1, { message: "Signature is required" }),
  otherCompany: z.string().optional(),
  otherSupervisor: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

// Predefined options
const companyOptions = ["Ramo", "Ember"];
const supervisorOptions = ["Rajkumar", "Yubing", "Gao Shin ming","Safety", "Rajesh","Manoj" ];

export default function AttendanceForm() {
  const { toast } = useToast();
  // Setup state for date/time
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [formattedDateTime, setFormattedDateTime] = useState(formatDateTime(currentDateTime));
  const createMutation = useCreateAttendance();
  
  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      dateTime: currentDateTime,
      name: "",
      company: "",
      supervisor: "",
      signatureData: "",
      otherCompany: "",
      otherSupervisor: "",
    },
  });
  
  // Update the date/time every minute
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setCurrentDateTime(now);
      setFormattedDateTime(formatDateTime(now));
      
      // Update the form value as well
      if (form) {
        form.setValue("dateTime", now);
      }
    };
    
    // Start interval
    const intervalId = setInterval(updateDateTime, 60000);
    
    // Cleanup
    return () => clearInterval(intervalId);
  }, []); // Empty dependency array, but will capture form in closure

  const companyValue = form.watch("company");
  const supervisorValue = form.watch("supervisor");

  const onSubmit = (data: FormValues) => {
    // Validate required fields
    if (!data.name || data.name.trim() === '') {
      toast({
        title: "Missing information",
        description: "Please enter your name.",
        variant: "destructive",
      });
      return;
    }
    
    // Determine final company value
    let finalCompany = data.company;
    if (finalCompany === "other") {
      if (!data.otherCompany || data.otherCompany.trim() === '') {
        toast({
          title: "Missing information",
          description: "Please specify the company name.",
          variant: "destructive",
        });
        return;
      }
      finalCompany = data.otherCompany;
    } else if (!finalCompany) {
      toast({
        title: "Missing information",
        description: "Please select a company.",
        variant: "destructive",
      });
      return;
    }
    
    // Determine final supervisor value
    let finalSupervisor = data.supervisor;
    if (finalSupervisor === "other") {
      if (!data.otherSupervisor || data.otherSupervisor.trim() === '') {
        toast({
          title: "Missing information",
          description: "Please specify the supervisor name.",
          variant: "destructive",
        });
        return;
      }
      finalSupervisor = data.otherSupervisor;
    } else if (!finalSupervisor) {
      toast({
        title: "Missing information",
        description: "Please select a supervisor.",
        variant: "destructive",
      });
      return;
    }
    
    // Check if signature exists
    if (!data.signatureData) {
      toast({
        title: "Missing signature",
        description: "Please sign the form before submitting.",
        variant: "destructive",
      });
      return;
    }

    // Ensure dateTime is a Date object, not a string
    const dateTimeValue = typeof data.dateTime === 'string' 
      ? new Date() // If it's a string, use current date
      : data.dateTime; // Otherwise use the date object

    createMutation.mutate(
      {
        dateTime: dateTimeValue,
        name: data.name.trim(), // Trim whitespace to prevent near-duplicates
        company: finalCompany,
        supervisor: finalSupervisor,
        signatureData: data.signatureData,
      },
      {
        onSuccess: () => {
          toast({
            title: "Attendance submitted",
            description: "Your attendance has been recorded successfully.",
          });
          
          // Get the current date for the reset form
          const now = new Date();
          
          // Update state
          setCurrentDateTime(now);
          setFormattedDateTime(formatDateTime(now));
          
          // Reset form
          form.reset({
            dateTime: now,
            name: "",
            company: "",
            supervisor: "",
            signatureData: "",
            otherCompany: "",
            otherSupervisor: "",
          });
        },
        onError: (error) => {
          console.error('Form submission error:', error);
          // Check if the error message indicates a duplicate entry
          const errorMessage = error instanceof Error ? error.message : "An error occurred while submitting the form.";
          const isDuplicateError = errorMessage.toLowerCase().includes('already recorded') || 
                                 errorMessage.toLowerCase().includes('duplicate');
          
          toast({
            title: isDuplicateError ? "Duplicate Entry" : "Submission Failed",
            description: errorMessage,
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <h2 className="text-xl font-semibold mb-6">Attendance Form</h2>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Date and Time */}
          <div>
            <Label htmlFor="dateTime">Date and Time</Label>
            <Input
              id="dateTime"
              value={formattedDateTime}
              readOnly
              className="bg-gray-50 cursor-not-allowed"
            />
          </div>
          
          {/* Name */}
          <div>
            <Label htmlFor="name">
              Employee Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Enter your full name"
              {...form.register("name")}
              className={form.formState.errors.name ? "border-red-500" : ""}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>
          
          {/* Company Selection */}
          <div>
            <Label>
              Company <span className="text-red-500">*</span>
            </Label>
            <RadioGroup
              value={companyValue}
              onValueChange={(value) => form.setValue("company", value)}
              className="space-y-2 mt-2"
            >
              {companyOptions.map((company) => (
                <div key={company} className="flex items-center">
                  <RadioGroupItem
                    value={company}
                    id={`company-${company}`}
                  />
                  <Label htmlFor={`company-${company}`} className="ml-2 cursor-pointer">
                    {company}
                  </Label>
                </div>
              ))}
              
              {/* Other option */}
              <div>
                <div className="flex items-center">
                  <RadioGroupItem value="other" id="company-other" />
                  <Label htmlFor="company-other" className="ml-2 cursor-pointer">
                    Other
                  </Label>
                </div>
                
                {companyValue === "other" && (
                  <div className="mt-2 pl-6">
                    <Input
                      placeholder="Specify company name"
                      {...form.register("otherCompany")}
                      className={form.formState.errors.otherCompany ? "border-red-500" : ""}
                    />
                    {form.formState.errors.otherCompany && (
                      <p className="text-sm text-red-500 mt-1">
                        {form.formState.errors.otherCompany.message}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </RadioGroup>
            {form.formState.errors.company && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.company.message}
              </p>
            )}
          </div>
          
          {/* Supervisor Selection */}
          <div>
            <Label>
              Supervisor <span className="text-red-500">*</span>
            </Label>
            <RadioGroup
              value={supervisorValue}
              onValueChange={(value) => form.setValue("supervisor", value)}
              className="space-y-2 mt-2"
            >
              {supervisorOptions.map((supervisor) => (
                <div key={supervisor} className="flex items-center">
                  <RadioGroupItem
                    value={supervisor}
                    id={`supervisor-${supervisor}`}
                  />
                  <Label htmlFor={`supervisor-${supervisor}`} className="ml-2 cursor-pointer">
                    {supervisor}
                  </Label>
                </div>
              ))}
              
              {/* Other option */}
              <div>
                <div className="flex items-center">
                  <RadioGroupItem value="other" id="supervisor-other" />
                  <Label htmlFor="supervisor-other" className="ml-2 cursor-pointer">
                    Other
                  </Label>
                </div>
                
                {supervisorValue === "other" && (
                  <div className="mt-2 pl-6">
                    <Input
                      placeholder="Specify supervisor name"
                      {...form.register("otherSupervisor")}
                      className={form.formState.errors.otherSupervisor ? "border-red-500" : ""}
                    />
                    {form.formState.errors.otherSupervisor && (
                      <p className="text-sm text-red-500 mt-1">
                        {form.formState.errors.otherSupervisor.message}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </RadioGroup>
            {form.formState.errors.supervisor && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.supervisor.message}
              </p>
            )}
          </div>
          
          {/* Signature Capture */}
          <div>
            <Label>
              Signature <span className="text-red-500">*</span>
            </Label>
            <SignatureCanvas
              value={form.watch("signatureData")}
              onChange={(value) => form.setValue("signatureData", value)}
            />
            {form.formState.errors.signatureData && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.signatureData.message}
              </p>
            )}
          </div>
          
          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full" 
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? "Submitting..." : "Submit Attendance"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
