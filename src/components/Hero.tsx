import { Button } from "@/components/ui/button";
import { ArrowRight, Heart, Stethoscope, Activity, Users, MapPin, Calendar } from "lucide-react";
import { Link } from "react-router-dom";

const Hero = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center gradient-hero overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-8 shadow-soft">
            <Activity className="w-5 h-5" />
            <span className="text-sm font-medium">AI-Powered Healthcare</span>
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 bg-gradient-to-r from-primary via-primary-glow to-secondary bg-clip-text text-transparent">
            Your Health, Our Priority
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto">
            Get instant medical guidance with our AI-powered triage system. Connect with doctors and find nearby pharmacies—all in one place.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-20">
            <Link to="/chat">
              <Button size="lg" className="gradient-primary shadow-glow hover:scale-105 transition-smooth group">
                Start AI Consultation
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/doctors">
              <Button size="lg" variant="outline" className="shadow-soft hover:shadow-medium transition-smooth">
                Find Doctors
              </Button>
            </Link>
          </div>

          {/* Feature cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mt-16">
            <Link to="/chat" className="block">
              <div className="bg-card rounded-3xl p-8 shadow-soft hover:shadow-medium transition-smooth animate-slide-up cursor-pointer hover:scale-105">
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                  <Stethoscope className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">AI Symptom Checker</h3>
                <p className="text-muted-foreground text-base">
                  Describe your symptoms and get instant AI-powered health assessment.
                </p>
              </div>
            </Link>

            <Link to="/doctors" className="block">
              <div className="bg-card rounded-3xl p-8 shadow-soft hover:shadow-medium transition-smooth animate-slide-up delay-150 cursor-pointer hover:scale-105">
                <div className="w-14 h-14 bg-secondary/10 rounded-xl flex items-center justify-center mb-6">
                  <Users className="w-7 h-7 text-secondary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Connect with Doctors</h3>
                <p className="text-muted-foreground text-base">
                  Book online or physical appointments with qualified healthcare professionals.
                </p>
              </div>
            </Link>

            <Link to="/pharmacies" className="block">
              <div className="bg-card rounded-3xl p-8 shadow-soft hover:shadow-medium transition-smooth animate-slide-up delay-300 cursor-pointer hover:scale-105">
                <div className="w-14 h-14 bg-warning/10 rounded-xl flex items-center justify-center mb-6">
                  <MapPin className="w-7 h-7 text-warning" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Find Pharmacies</h3>
                <p className="text-muted-foreground text-base">
                  Locate registered pharmacies near you for quick medication access.
                </p>
              </div>
            </Link>

            <Link to="/appointments" className="block">
              <div className="bg-card rounded-3xl p-8 shadow-soft hover:shadow-medium transition-smooth animate-slide-up delay-450 cursor-pointer hover:scale-105">
                <div className="w-14 h-14 bg-purple-500/10 rounded-xl flex items-center justify-center mb-6">
                  <Calendar className="w-7 h-7 text-purple-500" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Manage Appointments</h3>
                <p className="text-muted-foreground text-base">
                  Easily schedule and manage your medical appointments.
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
