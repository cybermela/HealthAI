import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { HeartPulse, LogOut, User, Menu, X, FileText, Calendar, Stethoscope, Pill, MessageSquare, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<{ full_name?: string } | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .single();
    
    if (data) {
      setProfile(data);
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setMobileMenuOpen(false);
      navigate("/");
      toast({
        title: "Signed out successfully",
      });
    }
  };

  const isActive = (path: string) => location.pathname === path;

  const getInitials = () => {
    return 'U';
  };

  const navItems = [
    { to: "/chat", label: "AI Consultation", icon: MessageSquare },
    { to: "/doctors", label: "Doctors", icon: Stethoscope },
    { to: "/pharmacies", label: "Pharmacies", icon: Pill },
    { to: "/appointments", label: "Appointments", icon: Calendar },
    { to: "/medical-documents", label: "Documents", icon: FileText },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-glow group-hover:scale-110 transition-smooth">
              <HeartPulse className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              HealthAI
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {/* Removed Home button as per request */}
            {/* <Link to="/">
              <Button 
                variant={isActive("/") ? "secondary" : "ghost"}
                className="transition-smooth"
              >
                Home
              </Button>
            </Link> */}
            {user && navItems.map((item) => (
              <Link key={item.to} to={item.to}>
                <Button 
                  variant={isActive(item.to) ? "secondary" : "ghost"}
                  className="transition-smooth gap-2"
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Button>
              </Link>
            ))}
          </div>

          {/* User Menu & Mobile Toggle */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {/* User Dropdown - Desktop */}
                <div className="hidden sm:block">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        className="gap-2 hover-scale"
                      >
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-gradient-primary text-white">
                            <User className="w-4 h-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="hidden md:flex flex-col items-start">
                          <span className="text-sm font-medium">
                            {profile?.full_name || 'User'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {user.email}
                          </span>
                        </div>
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent 
                      align="end" 
                      className="w-56 bg-background border shadow-lg z-50"
                    >
                      <DropdownMenuLabel>
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium">
                            {profile?.full_name || 'My Account'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => navigate("/profile")}
                        className="cursor-pointer"
                      >
                        <User className="w-4 h-4 mr-2" />
                        Profile Settings
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => navigate("/appointments")}
                        className="cursor-pointer"
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        My Appointments
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => navigate("/medical-documents")}
                        className="cursor-pointer"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        My Documents
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={handleSignOut}
                        className="cursor-pointer text-destructive focus:text-destructive"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Mobile Menu Toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  {mobileMenuOpen ? (
                    <X className="w-5 h-5" />
                  ) : (
                    <Menu className="w-5 h-5" />
                  )}
                </Button>
              </>
            ) : (
              <Link to="/auth">
                <Button className="gradient-primary shadow-glow hover:scale-105 transition-smooth">
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && user && (
          <div className="lg:hidden py-4 border-t border-border animate-fade-in">
            {/* User Info */}
            <div className="flex items-center gap-3 px-4 py-3 mb-2 bg-muted/50 rounded-lg">
              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-gradient-primary text-white">
                  <User className="w-5 h-5" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {profile?.full_name || 'User'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="space-y-1">
              <Link to="/" onClick={() => setMobileMenuOpen(false)}>
                <Button 
                  variant={isActive("/") ? "secondary" : "ghost"}
                  className="w-full justify-start"
                >
                  Home
                </Button>
              </Link>
              {navItems.map((item) => (
                <Link 
                  key={item.to} 
                  to={item.to} 
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Button 
                    variant={isActive(item.to) ? "secondary" : "ghost"}
                    className="w-full justify-start gap-2"
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Button>
                </Link>
              ))}
              
              <div className="pt-2 mt-2 border-t border-border">
                <Link to="/profile" onClick={() => setMobileMenuOpen(false)}>
                  <Button 
                    variant="ghost"
                    className="w-full justify-start gap-2"
                  >
                    <User className="w-4 h-4" />
                    Profile Settings
                  </Button>
                </Link>
                <Button 
                  variant="ghost"
                  className="w-full justify-start gap-2 text-destructive hover:text-destructive"
                  onClick={handleSignOut}
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
