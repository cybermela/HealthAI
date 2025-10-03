import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const sanitizeInput = (input: string, maxLength: number = 2000): string => {
  if (!input || typeof input !== 'string') return '';
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, '');
};

const validateAge = (age: number | undefined): number | null => {
  if (age === undefined || age === null) return null;
  
  if (typeof age !== 'number' || isNaN(age)) return null;
  if (age < 0 || age > 150) return null;
  
  return Math.floor(age);
};

const validateGender = (gender: string | undefined): string | null => {
  if (!gender) return null;
  
  const validGenders = ['male', 'female', 'other'];
  const normalizedGender = gender.toLowerCase().trim();
  
  if (validGenders.includes(normalizedGender)) {
    return normalizedGender;
  }
  
  return null;
};

const validateMessages = (messages: any[]): boolean => {
  if (!Array.isArray(messages)) return false;
  
  if (messages.length > 50) return false;
  
  for (const msg of messages) {
    if (!msg || typeof msg !== 'object') return false;
    if (!msg.role || !msg.content) return false;
    if (typeof msg.role !== 'string' || typeof msg.content !== 'string') return false;
    if (!['user', 'assistant'].includes(msg.role)) return false;
    if (msg.content.length > 2000) return false;
  }
  
  return true;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symptoms, messages = [], gender, age } = await req.json();

    if (!symptoms || typeof symptoms !== 'string') {
      console.error('Invalid symptoms input');
      return new Response(
        JSON.stringify({ error: 'Symptoms are required and must be a string' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!validateMessages(messages)) {
      console.error('Invalid messages array structure');
      return new Response(
        JSON.stringify({ error: 'Invalid message format' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const sanitizedSymptoms = sanitizeInput(symptoms);
    const validatedAge = validateAge(age);
    const validatedGender = validateGender(gender);
    console.log("Validated inputs - symptoms length:", sanitizedSymptoms.length, "gender:", validatedGender, "age:", validatedAge);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const patientContext = validatedGender || validatedAge ? `\n\nPatient Profile: ${validatedGender ? `Gender: ${validatedGender}` : ''}${validatedAge ? `, Age: ${validatedAge}` : ''}` : '';
    
    const systemPrompt = `You are a healthcare AI assistant powered by Google's Gemini AI. Provide specific, actionable health guidance tailored to the patient's profile.${patientContext}

**Your response must include:**

1. ASSESSMENT: Clear analysis with severity (MILD, MODERATE, SEVERE, or EMERGENCY)${validatedGender ? ` Consider gender-specific health factors for ${validatedGender} patients.` : ''}
2. IMMEDIATE ACTIONS: 3-5 specific steps to take NOW
3. WARNING SIGNS: Specific symptoms requiring emergency care

**CRITICAL:** At the end of your response, include this EXACT format on separate lines:
SPECIALTY: [specialty name] (e.g., General Practitioner, Cardiologist, Neurologist, ENT, Dermatologist, etc.)
PHARMACY_NEEDED: [YES or NO]
URGENCY: [immediate, 24-hours, week, or routine]

For emergencies (chest pain, difficulty breathing, severe bleeding, stroke symptoms), start with "CALL EMERGENCY SERVICES IMMEDIATELY"

Always clarify this is guidance, not a diagnosis.

Current conversation: ${messages ? 'Ongoing triage conversation' : 'Initial consultation'}`;

    const sanitizedMessages = messages?.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: sanitizeInput(msg.content || '', 2000)
    })) || [];

    const conversationMessages = sanitizedMessages.length
      ? sanitizedMessages
      : [{ role: "user", content: `I'm experiencing the following symptoms: ${sanitizedSymptoms}` }];

    const response = await fetch("https://ai.gateway.healthai.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...conversationMessages
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      
      if (response.status === 429) {
        console.error('Rate limit exceeded:', errorText);
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { 
            status: 429, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      if (response.status === 402) {
        console.error('Payment required:', errorText);
        return new Response(
          JSON.stringify({ error: 'Service temporarily unavailable. Please contact support.' }),
          { 
            status: 402, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      console.error('AI API Error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to get AI response' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const data = await response.json();
    console.log("AI response received successfully");

    const aiMessage = data.choices[0]?.message?.content || "";

    return new Response(
      JSON.stringify({ 
        message: aiMessage,
        success: true 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Error in ai-diagnosis function:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        success: false 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
