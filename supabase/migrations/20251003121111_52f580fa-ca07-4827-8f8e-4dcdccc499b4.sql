-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  date_of_birth DATE,
  blood_type TEXT,
  allergies TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create consultations table
CREATE TABLE public.consultations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  symptoms TEXT NOT NULL,
  ai_diagnosis TEXT,
  severity_level TEXT CHECK (severity_level IN ('low', 'medium', 'high', 'emergency')),
  recommendation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create doctors table
CREATE TABLE public.doctors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  specialty TEXT NOT NULL,
  qualification TEXT,
  experience_years INTEGER,
  consultation_fee DECIMAL(10, 2),
  available_online BOOLEAN DEFAULT true,
  available_physical BOOLEAN DEFAULT true,
  address TEXT,
  phone TEXT,
  email TEXT,
  rating DECIMAL(3, 2) DEFAULT 0,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create pharmacies table
CREATE TABLE public.pharmacies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  operating_hours TEXT,
  is_24_hours BOOLEAN DEFAULT false,
  rating DECIMAL(3, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create appointments table
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE CASCADE NOT NULL,
  consultation_id UUID REFERENCES public.consultations(id),
  appointment_type TEXT CHECK (appointment_type IN ('online', 'physical')) NOT NULL,
  appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')) DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pharmacies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Consultations policies
CREATE POLICY "Users can view their own consultations"
  ON public.consultations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own consultations"
  ON public.consultations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Doctors policies (public read)
CREATE POLICY "Anyone can view doctors"
  ON public.doctors FOR SELECT
  TO authenticated
  USING (true);

-- Pharmacies policies (public read)
CREATE POLICY "Anyone can view pharmacies"
  ON public.pharmacies FOR SELECT
  TO authenticated
  USING (true);

-- Appointments policies
CREATE POLICY "Users can view their own appointments"
  ON public.appointments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own appointments"
  ON public.appointments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own appointments"
  ON public.appointments FOR UPDATE
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for profiles
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample doctors
INSERT INTO public.doctors (name, specialty, qualification, experience_years, consultation_fee, available_online, available_physical, address, phone, email, rating) VALUES
('Dr. Sarah Johnson', 'General Physician', 'MBBS, MD', 15, 50.00, true, true, '123 Medical Center, Downtown', '+1-555-0101', 'sarah.johnson@healthcenter.com', 4.8),
('Dr. Michael Chen', 'Cardiologist', 'MBBS, DM Cardiology', 20, 100.00, true, true, '456 Heart Hospital, Medical District', '+1-555-0102', 'michael.chen@hearthospital.com', 4.9),
('Dr. Emily Rodriguez', 'Pediatrician', 'MBBS, MD Pediatrics', 12, 60.00, true, true, '789 Children Hospital, Green Valley', '+1-555-0103', 'emily.rodriguez@childrenhospital.com', 4.7),
('Dr. James Wilson', 'Dermatologist', 'MBBS, MD Dermatology', 10, 80.00, true, false, '321 Skin Care Clinic, City Center', '+1-555-0104', 'james.wilson@skincareclinic.com', 4.6),
('Dr. Aisha Patel', 'Psychiatrist', 'MBBS, MD Psychiatry', 18, 120.00, true, true, '654 Mental Health Center, Riverside', '+1-555-0105', 'aisha.patel@mentalhealthcenter.com', 4.9);

-- Insert sample pharmacies
INSERT INTO public.pharmacies (name, address, phone, email, latitude, longitude, operating_hours, is_24_hours, rating) VALUES
('HealthPlus Pharmacy', '100 Main Street, Downtown', '+1-555-0201', 'info@healthplus.com', 40.7128, -74.0060, '8:00 AM - 10:00 PM', false, 4.5),
('MediCare 24/7', '200 Emergency Lane, Medical District', '+1-555-0202', 'support@medicare247.com', 40.7589, -73.9851, 'Open 24 Hours', true, 4.8),
('Green Cross Pharmacy', '300 Wellness Ave, Green Valley', '+1-555-0203', 'contact@greencross.com', 40.7489, -73.9680, '9:00 AM - 9:00 PM', false, 4.6),
('Quick Meds', '400 Speed Street, City Center', '+1-555-0204', 'hello@quickmeds.com', 40.7282, -73.9942, '7:00 AM - 11:00 PM', false, 4.4),
('Riverside Pharmacy', '500 River Road, Riverside', '+1-555-0205', 'info@riversidepharmacy.com', 40.7614, -73.9776, '8:00 AM - 8:00 PM', false, 4.7);