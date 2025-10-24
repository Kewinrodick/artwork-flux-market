-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('designer', 'buyer', 'admin');

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create profiles table (NO role stored here)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  avatar_url TEXT,
  date_joined TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create designs table
CREATE TABLE public.designs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  designer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  likes_count INTEGER DEFAULT 0,
  is_trending BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on designs
ALTER TABLE public.designs ENABLE ROW LEVEL SECURITY;

-- Designs policies
CREATE POLICY "Anyone can view designs"
  ON public.designs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Designers can insert own designs"
  ON public.designs FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = designer_id AND
    public.has_role(auth.uid(), 'designer')
  );

CREATE POLICY "Designers can update own designs"
  ON public.designs FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = designer_id AND
    public.has_role(auth.uid(), 'designer')
  );

CREATE POLICY "Designers can delete own designs"
  ON public.designs FOR DELETE
  TO authenticated
  USING (
    auth.uid() = designer_id AND
    public.has_role(auth.uid(), 'designer')
  );

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  designer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  design_id UUID REFERENCES public.designs(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL,
  platform_fee DECIMAL(10, 2) NOT NULL,
  designer_earnings DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  stripe_payment_intent_id TEXT,
  stripe_session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Transactions policies
CREATE POLICY "Buyers can view own purchases"
  ON public.transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = buyer_id);

CREATE POLICY "Designers can view own sales"
  ON public.transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = designer_id);

CREATE POLICY "Admins can view all transactions"
  ON public.transactions FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Trigger to update profiles updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_designs_updated_at
  BEFORE UPDATE ON public.designs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();