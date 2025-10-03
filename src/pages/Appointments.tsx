import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Calendar, Clock, Video, Building, X, Loader2, ArrowLeft } from "lucide-react";
import { format } from "date-fns";

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_type: string;
  status: string;
  notes: string;
  doctor: {
    name: string;
    specialty: string;
  };
}

const Appointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      fetchAppointments();
    };
    checkAuth();
  }, [navigate]);

  const fetchAppointments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("appointments")
        .select(`
          *,
          doctor:doctors(name, specialty)
        `)
        .eq("user_id", user.id)
        .order("appointment_date", { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
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

  const handleCancelAppointment = async (id: string) => {
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ status: "cancelled" })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Appointment Cancelled",
        description: "Your appointment has been cancelled successfully.",
      });
      fetchAppointments();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-success/10 text-success hover:bg-success/20";
      case "pending":
        return "bg-warning/10 text-warning hover:bg-warning/20";
      case "cancelled":
        return "bg-destructive/10 text-destructive hover:bg-destructive/20";
      default:
        return "bg-muted/10 text-muted-foreground hover:bg-muted/20";
    }
  };

  if (isLoading) {
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
        
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 animate-fade-in">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              My Appointments
            </h1>
            <p className="text-muted-foreground">
              View and manage your upcoming consultations
            </p>
          </div>

          {appointments.length === 0 ? (
            <Card className="p-12 text-center shadow-medium animate-fade-in">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No Appointments Yet</h3>
              <p className="text-muted-foreground mb-6">
                Book your first consultation with our healthcare professionals
              </p>
              <Button
                onClick={() => navigate("/doctors")}
                className="gradient-primary shadow-glow"
              >
                Find Doctors
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {appointments.map((appointment, index) => (
                <Card
                  key={appointment.id}
                  className="p-6 shadow-medium hover:shadow-glow transition-smooth animate-slide-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold mb-1">
                        {appointment.doctor.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {appointment.doctor.specialty}
                      </p>
                    </div>
                    <Badge className={getStatusColor(appointment.status)}>
                      {appointment.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-primary" />
                      <span className="text-sm">
                        {format(new Date(appointment.appointment_date), "MMMM d, yyyy")}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-primary" />
                      <span className="text-sm">
                        {format(new Date(appointment.appointment_date), "h:mm a")}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {appointment.appointment_type === "online" ? (
                        <>
                          <Video className="w-5 h-5 text-primary" />
                          <span className="text-sm">Online Consultation</span>
                        </>
                      ) : (
                        <>
                          <Building className="w-5 h-5 text-primary" />
                          <span className="text-sm">In-Person Visit</span>
                        </>
                      )}
                    </div>
                  </div>

                  {appointment.notes && (
                    <div className="p-3 bg-muted/30 rounded-lg mb-4">
                      <p className="text-sm text-muted-foreground">
                        <strong>Notes:</strong> {appointment.notes}
                      </p>
                    </div>
                  )}

                  {appointment.status !== "cancelled" && (
                    <Button
                      onClick={() => handleCancelAppointment(appointment.id)}
                      variant="destructive"
                      size="sm"
                      className="shadow-soft"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel Appointment
                    </Button>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Appointments;
