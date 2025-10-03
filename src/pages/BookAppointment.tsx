import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import { Loader2, Calendar as CalendarIcon, Clock, ArrowLeft } from "lucide-react";
import { format } from "date-fns";

interface Doctor {
  name: string;
  consultation_fee: number;
}

const BookAppointment = () => {
  const [searchParams] = useSearchParams();
  const doctorId = searchParams.get("doctorId");
  const appointmentType = searchParams.get("type") as "online" | "physical";
  
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState("09:00");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuthAndFetchDoctor = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      if (doctorId) {
        const { data } = await supabase
          .from("doctors")
          .select("*")
          .eq("id", doctorId)
          .single();
        setDoctor(data);
      }
    };
    checkAuthAndFetchDoctor();
  }, [doctorId, navigate]);

  const timeSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !doctorId) return;

    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const appointmentDate = new Date(date);
      const [hours, minutes] = time.split(":");
      appointmentDate.setHours(parseInt(hours), parseInt(minutes));

      const { error } = await supabase.from("appointments").insert({
        user_id: user.id,
        doctor_id: doctorId,
        appointment_type: appointmentType,
        appointment_date: appointmentDate.toISOString(),
        notes,
      });

      if (error) throw error;

      toast({
        title: "Appointment Booked!",
        description: "Your appointment has been scheduled successfully.",
      });
      navigate("/appointments");
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!doctor) {
    return (
      <div className="min-h-screen bg-gradient-hero">
        <Navigation />
        <div className="container mx-auto px-4 py-16 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        
        <div className="max-w-2xl mx-auto">
          <Card className="p-8 shadow-glow animate-fade-in">
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Book Appointment
            </h1>
            <p className="text-muted-foreground mb-6">
              Schedule a {appointmentType} consultation with {doctor.name}
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  Select Date
                </Label>
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={(date) => date < new Date()}
                  className="rounded-md border shadow-soft"
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Select Time
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {timeSlots.map((slot) => (
                    <Button
                      key={slot}
                      type="button"
                      variant={time === slot ? "default" : "outline"}
                      onClick={() => setTime(slot)}
                      className={time === slot ? "gradient-primary shadow-glow" : "shadow-soft"}
                    >
                      {slot}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any specific concerns or information for the doctor..."
                  className="min-h-[100px] shadow-soft"
                />
              </div>

              {date && (
                <div className="p-4 bg-primary/5 rounded-xl border border-primary/20">
                  <p className="text-sm font-medium mb-1">Appointment Summary:</p>
                  <p className="text-sm text-muted-foreground">
                    {format(date, "MMMM d, yyyy")} at {time} ({appointmentType})
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Fee: ${doctor.consultation_fee}
                  </p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full gradient-primary shadow-glow hover:scale-105 transition-smooth"
                disabled={!date || isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Confirm Appointment"
                )}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BookAppointment;
