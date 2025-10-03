import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Send, Bot, User, Loader2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";

interface Message {
  role: "user" | "assistant";
  content: string;
  specialty?: string;
  pharmacyNeeded?: boolean;
  urgency?: string;
}

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  consultation_fee: number;
  available_online: boolean;
  available_physical: boolean;
}

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm your AI health assistant. Please describe your symptoms, and I'll help assess your situation. Remember, I provide guidance only—not a medical diagnosis.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [recommendedDoctors, setRecommendedDoctors] = useState<Doctor[]>([]);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [userProfile, setUserProfile] = useState<{ gender?: string; date_of_birth?: string } | null>(null);
  const [lastRequestTime, setLastRequestTime] = useState<number>(0);
  const [requestCount, setRequestCount] = useState(0);
  const [requestResetTime, setRequestResetTime] = useState<Date | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      
      // Fetch user profile for gender-tailored recommendations
      const { data: profile } = await supabase
        .from("profiles")
        .select("gender, date_of_birth")
        .eq("id", session.user.id)
        .single();
      
      if (profile) {
        setUserProfile(profile);
      }
    };
    checkAuth();
  }, [navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const checkAIRateLimit = async (userId: string): Promise<boolean> => {
    const now = Date.now();
    
    // Check 5-second cooldown
    if (now - lastRequestTime < 5000) {
      const waitSeconds = Math.ceil((5000 - (now - lastRequestTime)) / 1000);
      toast({
        title: "Please wait",
        description: `Please wait ${waitSeconds} seconds before making another request`,
        variant: "destructive",
      });
      return false;
    }

    // Check hourly limit from database
    const { data, error } = await supabase
      .from('ai_request_limits')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Rate limit check error:', error);
      return true; // Allow on error
    }

    if (!data) {
      // Create new record
      await supabase
        .from('ai_request_limits')
        .insert({
          user_id: userId,
          request_count: 1,
          hour_start: new Date().toISOString(),
          last_request: new Date().toISOString(),
        });
      setRequestCount(1);
      return true;
    }

    const hourStart = new Date(data.hour_start);
    const hourDiff = (now - hourStart.getTime()) / (1000 * 60 * 60);

    if (hourDiff >= 1) {
      // Reset counter
      await supabase
        .from('ai_request_limits')
        .update({
          request_count: 1,
          hour_start: new Date().toISOString(),
          last_request: new Date().toISOString(),
        })
        .eq('user_id', userId);
      setRequestCount(1);
      setRequestResetTime(new Date(now + 60 * 60 * 1000));
      return true;
    }

    if (data.request_count >= 20) {
      const resetTime = new Date(hourStart.getTime() + 60 * 60 * 1000);
      setRequestResetTime(resetTime);
      toast({
        title: "Rate limit reached",
        description: `You can make up to 20 AI requests per hour. Try again after ${resetTime.toLocaleTimeString()}`,
        variant: "destructive",
      });
      return false;
    }

    // Increment counter
    await supabase
      .from('ai_request_limits')
      .update({
        request_count: data.request_count + 1,
        last_request: new Date().toISOString(),
      })
      .eq('user_id', userId);
    setRequestCount(data.request_count + 1);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to use the AI assistant",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    // Check rate limit
    const canProceed = await checkAIRateLimit(user.id);
    if (!canProceed) return;

    setLastRequestTime(Date.now());

    const userMessage: Message = { role: "user", content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      // Calculate age from date of birth
      let age: number | undefined;
      if (userProfile?.date_of_birth) {
        const birthDate = new Date(userProfile.date_of_birth);
        const today = new Date();
        age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
      }

      const { data, error } = await supabase.functions.invoke("ai-diagnosis", {
        body: {
          symptoms: input,
          messages: updatedMessages,
          gender: userProfile?.gender,
          age,
        },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      // Parse specialty and pharmacy info from AI response
      const responseText = data.message;
      const specialtyMatch = responseText.match(/SPECIALTY:\s*(.+)/i);
      const pharmacyMatch = responseText.match(/PHARMACY_NEEDED:\s*(YES|NO)/i);
      const urgencyMatch = responseText.match(/URGENCY:\s*(.+)/i);
      
      const specialty = specialtyMatch ? specialtyMatch[1].trim() : null;
      const pharmacyNeeded = pharmacyMatch ? pharmacyMatch[1].toUpperCase() === "YES" : false;
      const urgency = urgencyMatch ? urgencyMatch[1].trim() : null;

      // Remove metadata from displayed message
      const cleanedMessage = responseText
        .replace(/SPECIALTY:.+/i, "")
        .replace(/PHARMACY_NEEDED:.+/i, "")
        .replace(/URGENCY:.+/i, "")
        .trim();

      const assistantMessage: Message = {
        role: "assistant",
        content: cleanedMessage,
        specialty,
        pharmacyNeeded,
        urgency,
      };

      setMessages([...updatedMessages, assistantMessage]);

      // Fetch relevant doctors if specialty identified
      if (specialty) {
        const { data: doctors } = await supabase
          .from("doctors")
          .select("*")
          .ilike("specialty", `%${specialty}%`)
          .order("rating", { ascending: false })
          .limit(3);
        
        if (doctors && doctors.length > 0) {
          setRecommendedDoctors(doctors);
          setShowRecommendations(true);
        }
      }

      // Save consultation to database
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("consultations").insert({
          user_id: user.id,
          symptoms: input,
          ai_diagnosis: cleanedMessage,
          severity_level: urgency,
        });
      }
    } catch (error) {
      console.error("Error:", error);
      const message = error instanceof Error ? error.message : "Failed to get AI response";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        
        <Card className="shadow-medium animate-fade-in">
          <div className="border-b border-border p-4 bg-gradient-primary rounded-t-xl">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Bot className="w-6 h-6" />
              AI Health Assistant
            </h1>
            <p className="text-white/80 text-sm mt-1">
              Describe your symptoms for instant health guidance
            </p>
          </div>

          <div className="h-[500px] overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${
                  message.role === "user" ? "flex-row-reverse" : "flex-row"
                } animate-slide-up`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  {message.role === "user" ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                </div>
                <div
                  className={`flex-1 rounded-2xl p-4 shadow-soft ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground ml-12"
                      : "bg-card mr-12"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  
                  {/* Show recommendations after last assistant message */}
                  {message.role === "assistant" && 
                   index === messages.length - 1 && 
                   showRecommendations && 
                   (recommendedDoctors.length > 0 || message.pharmacyNeeded) && (
                    <div className="mt-4 pt-4 border-t border-border space-y-3">
                      {recommendedDoctors.length > 0 && (
                        <div>
                          <p className="text-sm font-semibold mb-2">Recommended Doctors:</p>
                          <div className="space-y-2">
                            {recommendedDoctors.map((doctor) => (
                              <div key={doctor.id} className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                                <div>
                                  <p className="font-medium text-sm">{doctor.name}</p>
                                  <p className="text-xs text-muted-foreground">{doctor.specialty} • ${doctor.consultation_fee}</p>
                                </div>
                                <div className="flex gap-2">
                                  {doctor.available_online && (
                                    <Button
                                      size="sm"
                                      onClick={() => navigate(`/book-appointment?doctorId=${doctor.id}&type=online`)}
                                      className="text-xs"
                                    >
                                      Online
                                    </Button>
                                  )}
                                  {doctor.available_physical && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => navigate(`/book-appointment?doctorId=${doctor.id}&type=physical`)}
                                      className="text-xs"
                                    >
                                      In-Person
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {message.pharmacyNeeded && (
                        <div>
                          <p className="text-sm font-semibold mb-2">Need Pharmacy?</p>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => navigate("/pharmacies")}
                            className="w-full"
                          >
                            Find Nearby Pharmacies
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 animate-slide-up">
                <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="flex-1 rounded-2xl p-4 bg-card shadow-soft mr-12">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="border-t border-border p-4">
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Describe your symptoms..."
                className="min-h-[80px] resize-none shadow-soft"
                disabled={isLoading}
              />
              <Button
                type="submit"
                size="icon"
                className="gradient-primary h-20 w-20 shadow-glow hover:scale-105 transition-smooth"
                disabled={isLoading || !input.trim()}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
          </form>
        </Card>

        <div className="mt-6 bg-warning/10 border border-warning/20 rounded-xl p-4 animate-fade-in">
          <p className="text-sm text-warning-foreground">
            <strong>Important:</strong> This AI assistant provides guidance only and is not a substitute for professional medical advice, diagnosis, or treatment. If you have a medical emergency, call emergency services immediately.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Chat;
