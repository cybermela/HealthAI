import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import {
  Star,
  MapPin,
  Phone,
  Mail,
  Video,
  Building,
  Calendar,
  Loader2,
  ArrowLeft,
  Info,
} from "lucide-react";

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  qualification: string;
  experience_years: number;
  consultation_fee: number;
  available_online: boolean;
  available_physical: boolean;
  address: string | null;
  phone: string | null;
  email: string | null;
  rating: number;
}

interface DoctorAccess {
  doctor_id: string;
}

const Doctors = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [grantedAccess, setGrantedAccess] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      await Promise.all([fetchDoctors(), fetchDoctorAccess()]);
    };
    checkAuth();
  }, [navigate]);

  const fetchDoctorAccess = async () => {
    const { data, error } = await supabase
      .from('doctor_access_granted')
      .select('doctor_id');
    
    if (!error && data) {
      setGrantedAccess(new Set(data.map((access: DoctorAccess) => access.doctor_id)));
    }
  };

  const fetchDoctors = async () => {
    try {
      const { data, error } = await supabase
        .from("doctors")
        .select("*")
        .order("rating", { ascending: false });

      if (error) throw error;
      setDoctors(data || []);
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

  const handleBookAppointment = (doctor: Doctor, type: "online" | "physical") => {
    navigate(`/book-appointment?doctorId=${doctor.id}&type=${type}`);
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
        
        <div className="max-w-6xl mx-auto">
          <div className="mb-8 animate-fade-in">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Find Doctors
            </h1>
            <p className="text-muted-foreground">
              Connect with qualified healthcare professionals for online or in-person consultations
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {doctors.map((doctor, index) => (
              <Card
                key={doctor.id}
                className="p-6 shadow-medium hover:shadow-glow transition-smooth animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold mb-1">{doctor.name}</h3>
                    <Badge className="mb-2 bg-primary/10 text-primary hover:bg-primary/20">
                      {doctor.specialty}
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      {doctor.qualification}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 bg-warning/10 px-3 py-1 rounded-full">
                    <Star className="w-4 h-4 fill-warning text-warning" />
                    <span className="font-semibold text-warning">
                      {doctor.rating}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 mb-4 text-sm text-muted-foreground">
                  {grantedAccess.has(doctor.id) ? (
                    <>
                      {doctor.address && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{doctor.address}</span>
                        </div>
                      )}
                      {doctor.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          <span>{doctor.phone}</span>
                        </div>
                      )}
                      {doctor.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          <span>{doctor.email}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                      <Info className="w-4 h-4" />
                      <span>Contact details available after booking</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{doctor.experience_years} years experience</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-muted-foreground">
                      Consultation Fee
                    </span>
                    <span className="text-lg font-semibold text-primary">
                      ${doctor.consultation_fee}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    {doctor.available_online && (
                      <Button
                        onClick={() => handleBookAppointment(doctor, "online")}
                        className="flex-1 gradient-primary shadow-soft hover:shadow-medium transition-smooth"
                      >
                        <Video className="w-4 h-4 mr-2" />
                        Online
                      </Button>
                    )}
                    {doctor.available_physical && (
                      <Button
                        onClick={() => handleBookAppointment(doctor, "physical")}
                        variant="outline"
                        className="flex-1 shadow-soft hover:shadow-medium transition-smooth"
                      >
                        <Building className="w-4 h-4 mr-2" />
                        In-Person
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Doctors;
