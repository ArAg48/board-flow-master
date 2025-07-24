-- Create enum types
CREATE TYPE public.user_role AS ENUM ('manager', 'technician');
CREATE TYPE public.repair_status AS ENUM ('pending', 'in_progress', 'completed', 'scrapped');
CREATE TYPE public.session_status AS ENUM ('completed', 'paused', 'abandoned', 'active');
CREATE TYPE public.retest_result AS ENUM ('pass', 'fail');
CREATE TYPE public.order_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');

-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'technician',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create hardware orders table
CREATE TABLE public.hardware_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  order_date DATE NOT NULL,
  delivery_date DATE,
  status order_status NOT NULL DEFAULT 'pending',
  total_amount DECIMAL(10,2),
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create PTL orders table
CREATE TABLE public.ptl_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ptl_order_number TEXT NOT NULL UNIQUE,
  hardware_order_id UUID REFERENCES public.hardware_orders(id) ON DELETE CASCADE,
  board_type TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  status order_status NOT NULL DEFAULT 'pending',
  test_parameters JSONB,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create scan sessions table
CREATE TABLE public.scan_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ptl_order_id UUID NOT NULL REFERENCES public.ptl_orders(id) ON DELETE CASCADE,
  technician_id UUID NOT NULL REFERENCES public.profiles(id),
  start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_time TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  total_scanned INTEGER NOT NULL DEFAULT 0,
  pass_count INTEGER NOT NULL DEFAULT 0,
  fail_count INTEGER NOT NULL DEFAULT 0,
  pass_rate DECIMAL(5,2),
  tester_config JSONB NOT NULL,
  status session_status NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create repair entries table
CREATE TABLE public.repair_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  qr_code TEXT NOT NULL,
  board_type TEXT NOT NULL,
  failure_reason TEXT NOT NULL,
  failure_date DATE NOT NULL,
  repair_status repair_status NOT NULL DEFAULT 'pending',
  assigned_technician_id UUID REFERENCES public.profiles(id),
  repair_notes TEXT,
  repair_start_date DATE,
  repair_completed_date DATE,
  retest_results retest_result,
  ptl_order_id UUID NOT NULL REFERENCES public.ptl_orders(id),
  original_session_id UUID NOT NULL REFERENCES public.scan_sessions(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hardware_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ptl_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repair_entries ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS user_role
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = user_id;
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Managers can view all profiles" ON public.profiles
  FOR SELECT USING (public.get_user_role(auth.uid()) = 'manager');

-- RLS Policies for hardware_orders
CREATE POLICY "Managers can manage hardware orders" ON public.hardware_orders
  FOR ALL USING (public.get_user_role(auth.uid()) = 'manager');

CREATE POLICY "Technicians can view hardware orders" ON public.hardware_orders
  FOR SELECT USING (public.get_user_role(auth.uid()) IN ('manager', 'technician'));

-- RLS Policies for ptl_orders
CREATE POLICY "Managers can manage PTL orders" ON public.ptl_orders
  FOR ALL USING (public.get_user_role(auth.uid()) = 'manager');

CREATE POLICY "Technicians can view PTL orders" ON public.ptl_orders
  FOR SELECT USING (public.get_user_role(auth.uid()) IN ('manager', 'technician'));

-- RLS Policies for scan_sessions
CREATE POLICY "Users can manage their own scan sessions" ON public.scan_sessions
  FOR ALL USING (technician_id = auth.uid());

CREATE POLICY "Managers can view all scan sessions" ON public.scan_sessions
  FOR SELECT USING (public.get_user_role(auth.uid()) = 'manager');

-- RLS Policies for repair_entries
CREATE POLICY "Users can manage repair entries they're assigned to" ON public.repair_entries
  FOR ALL USING (assigned_technician_id = auth.uid() OR public.get_user_role(auth.uid()) = 'manager');

CREATE POLICY "Managers can manage all repair entries" ON public.repair_entries
  FOR ALL USING (public.get_user_role(auth.uid()) = 'manager');

-- Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data ->> 'role')::user_role, 'technician')
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_hardware_orders_updated_at
  BEFORE UPDATE ON public.hardware_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ptl_orders_updated_at
  BEFORE UPDATE ON public.ptl_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_scan_sessions_updated_at
  BEFORE UPDATE ON public.scan_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_repair_entries_updated_at
  BEFORE UPDATE ON public.repair_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX idx_hardware_orders_order_number ON public.hardware_orders(order_number);
CREATE INDEX idx_ptl_orders_ptl_order_number ON public.ptl_orders(ptl_order_number);
CREATE INDEX idx_ptl_orders_hardware_order_id ON public.ptl_orders(hardware_order_id);
CREATE INDEX idx_scan_sessions_ptl_order_id ON public.scan_sessions(ptl_order_id);
CREATE INDEX idx_scan_sessions_technician_id ON public.scan_sessions(technician_id);
CREATE INDEX idx_repair_entries_ptl_order_id ON public.repair_entries(ptl_order_id);
CREATE INDEX idx_repair_entries_assigned_technician_id ON public.repair_entries(assigned_technician_id);