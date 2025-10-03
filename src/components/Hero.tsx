import { Button } from "@/components/ui/button";
import { ArrowRight, Heart, Stethoscope, Activity } from "lucide-react";
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
        <div className="max-w-4xl mx-auto text-center animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-8 shadow-soft">
            <Activity className="w-4 h-4" />
            <span className="text-sm font-medium">AI-Powered Healthcare</span>
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-primary-glow to-secondary bg-clip-text text-transparent">
            Your Health, Our Priority
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            Get instant medical guidance with our AI-powered triage system. Connect with doctors and find nearby pharmacies—all in one place.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
            <Link to="/chat" className="block">
              <div className="bg-card rounded-2xl p-6 shadow-soft hover:shadow-medium transition-smooth animate-slide-up cursor-pointer hover:scale-105">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                  <Stethoscope className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">AI Symptom Checker</h3>
                <p className="text-muted-foreground text-sm">
                  Describe your symptoms and get instant AI-powered health assessment
                </p>
              </div>
            </Link>

            <Link to="/doctors" className="block">
              <div className="bg-card rounded-2xl p-6 shadow-soft hover:shadow-medium transition-smooth animate-slide-up delay-150 cursor-pointer hover:scale-105">
                <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center mb-4">
                  <Heart className="w-6 h-6 text-secondary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Connect with Doctors</h3>
                <p className="text-muted-foreground text-sm">
                  Book online or physical appointments with qualified healthcare professionals
                </p>
              </div>
            </Link>

            <Link to="/pharmacies" className="block">
              <div className="bg-card rounded-2xl p-6 shadow-soft hover:shadow-medium transition-smooth animate-slide-up delay-300 cursor-pointer hover:scale-105">
                <div className="w-12 h-12 bg-warning/10 rounded-xl flex items-center justify-center mb-4">
                  <Activity className="w-6 h-6 text-warning" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Find Pharmacies</h3>
                <p className="text-muted-foreground text-sm">
                  Locate registered pharmacies near you for quick medication access
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
