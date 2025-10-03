import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Star,
  ExternalLink,
  Loader2,
  ArrowLeft,
} from "lucide-react";

interface Pharmacy {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  operating_hours: string;
  is_24_hours: boolean;
  rating: number;
}

const Pharmacies = () => {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
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
      fetchPharmacies();
    };
    checkAuth();
  }, [navigate]);

  const fetchPharmacies = async () => {
    try {
      const { data, error } = await supabase
        .from("pharmacies")
        .select("*")
        .order("rating", { ascending: false });

      if (error) throw error;
      setPharmacies(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const handleEmail = (email: string) => {
    window.location.href = `mailto:${email}`;
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
              Registered Pharmacies
            </h1>
            <p className="text-muted-foreground">
              Find registered pharmacies near you for quick medication access
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {pharmacies.map((pharmacy, index) => (
              <Card
                key={pharmacy.id}
                className="p-6 shadow-medium hover:shadow-glow transition-smooth animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{pharmacy.name}</h3>
                    {pharmacy.is_24_hours && (
                      <Badge className="bg-success/10 text-success hover:bg-success/20">
                        Open 24/7
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1 bg-warning/10 px-3 py-1 rounded-full">
                    <Star className="w-4 h-4 fill-warning text-warning" />
                    <span className="font-semibold text-warning">
                      {pharmacy.rating}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{pharmacy.address}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-primary flex-shrink-0" />
                    <a
                      href={`tel:${pharmacy.phone}`}
                      className="text-sm hover:text-primary transition-colors"
                    >
                      {pharmacy.phone}
                    </a>
                  </div>

                  {pharmacy.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-primary flex-shrink-0" />
                      <a
                        href={`mailto:${pharmacy.email}`}
                        className="text-sm hover:text-primary transition-colors"
                      >
                        {pharmacy.email}
                      </a>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-sm">{pharmacy.operating_hours}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => handleCall(pharmacy.phone)}
                    className="gradient-primary shadow-glow hover:scale-105 transition-smooth"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Call Now
                  </Button>
                  {pharmacy.email && (
                    <Button
                      variant="secondary"
                      onClick={() => handleEmail(pharmacy.email)}
                      className="shadow-soft hover:scale-105 transition-smooth"
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Email
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pharmacies;
