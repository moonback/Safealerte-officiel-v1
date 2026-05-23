-- ==========================================
-- SAFE ALERT - PHASE 1: SUPABASE SCHEMA
-- ==========================================

-- 1. EXTENSIONS & ENUMS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE user_role AS ENUM ('citoyen', 'admin', 'membre_equipe');
CREATE TYPE alert_status AS ENUM ('EN COURS', 'RESOLUE', 'ANNULEE');
CREATE TYPE alert_danger_level AS ENUM ('FAIBLE', 'MOYEN', 'ÉLEVÉ', 'TRÈS ÉLEVÉ');

-- 2. TABLES

-- Table: users (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role user_role DEFAULT 'citoyen' NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: alerts
CREATE TABLE public.alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL,
  victim_name TEXT NOT NULL,
  age INTEGER,
  height TEXT,
  description TEXT,
  suspect_vehicle TEXT,
  status alert_status DEFAULT 'EN COURS',
  danger_level alert_danger_level DEFAULT 'ÉLEVÉ',
  location TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  missing_since TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id)
);

-- Table: reports (signalements)
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alert_id UUID REFERENCES public.alerts(id),
  report_type TEXT NOT NULL,
  description TEXT,
  location TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  user_id UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: teams (équipes de recherche)
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  status TEXT DEFAULT 'En attente',
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: team_members
CREATE TABLE public.team_members (
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  is_leader BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (team_id, user_id)
);

-- Table: messages (chat d'équipes)
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT,
  media_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ROW LEVEL SECURITY (RLS) POLICIES

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Users: Read all public profiles, write own profile
CREATE POLICY "Public profiles are viewable by everyone." ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile." ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON public.users FOR UPDATE USING (auth.uid() = id);

-- Alerts: Read by everyone, Write/Update by admins only
CREATE POLICY "Alerts viewable by everyone." ON public.alerts FOR SELECT USING (true);
CREATE POLICY "Admins can insert alerts." ON public.alerts FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
);
CREATE POLICY "Admins can update alerts." ON public.alerts FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
);

-- Reports: Authenticated auth can create, users read their own, admins read all
CREATE POLICY "Users can insert reports." ON public.reports FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users read own reports, admins read all." ON public.reports FOR SELECT USING (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
);

-- Teams: Viewable by anyone
CREATE POLICY "Teams viewable by anyone." ON public.teams FOR SELECT USING (true);
CREATE POLICY "Team members viewable by anyone." ON public.team_members FOR SELECT USING (true);

-- Messages: Strictly team members and admins
CREATE POLICY "Messages readable by team members & admins." ON public.messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.team_members WHERE team_members.team_id = messages.team_id AND team_members.user_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
);
CREATE POLICY "Messages insertable by team members." ON public.messages FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.team_members WHERE team_members.team_id = messages.team_id AND team_members.user_id = auth.uid())
);

-- 4. STORAGE SETUP

-- NOTE: Please create the following buckets manually in the Supabase Dashboard -> Storage UI:
-- 1. 'avatars' (Public)
-- 2. 'alerts' (Public) 
-- 3. 'reports_media' (Private)

-- Once the buckets are created, you can run these Storage Policies:
CREATE POLICY "Avatars publicly accessible." ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Anyone can upload an avatar." ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Alerts images publicly accessible." ON storage.objects FOR SELECT USING (bucket_id = 'alerts');
CREATE POLICY "Admins can upload alert images." ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'alerts' AND EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin'));
