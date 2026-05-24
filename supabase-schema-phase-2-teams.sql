-- Migration pour la gestion en temps réel des équipes (SafeAlert)
-- Création des tables 'team_locations' et 'search_zones' avec RLS.

-- 1. Table team_locations (Position GPS en temps réel des équipes)
CREATE TABLE IF NOT EXISTS public.team_locations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE,
  latitude float8 NOT NULL,
  longitude float8 NOT NULL,
  updated_at timestamp with time zone DEFAULT now()
);

-- Index pour la performance des requêtes géographiques / temporelles
CREATE INDEX IF NOT EXISTS team_locations_team_id_idx ON public.team_locations(team_id);
CREATE INDEX IF NOT EXISTS team_locations_updated_at_idx ON public.team_locations(updated_at);

-- Enable RLS
ALTER TABLE public.team_locations ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour team_locations
-- Les admins peuvent tout voir et tout modifier
CREATE POLICY "Admins can view all team_locations" ON public.team_locations FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
);

CREATE POLICY "Admins can insert team_locations" ON public.team_locations FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
);

CREATE POLICY "Admins can update team_locations" ON public.team_locations FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
);

-- Les membres d'une équipe peuvent voir les positions de leur propre équipe
CREATE POLICY "Members can view their own team locations" ON public.team_locations FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.team_members WHERE team_members.team_id = team_locations.team_id AND team_members.user_id = auth.uid())
);

-- Les membres d'une équipe peuvent insérer leur propre position
CREATE POLICY "Members can insert their own team locations" ON public.team_locations FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.team_members WHERE team_members.team_id = team_locations.team_id AND team_members.user_id = auth.uid())
);


-- 2. Table search_zones (Polygones de recherche assignés aux équipes)
CREATE TABLE IF NOT EXISTS public.search_zones (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE,
  geometry jsonb NOT NULL, -- Stockage du GeoJSON du polygone
  created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS search_zones_team_id_idx ON public.search_zones(team_id);

-- Enable RLS
ALTER TABLE public.search_zones ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour search_zones
-- Les admins peuvent tout faire
CREATE POLICY "Admins can view all search_zones" ON public.search_zones FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
);

CREATE POLICY "Admins can insert search_zones" ON public.search_zones FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
);

CREATE POLICY "Admins can update search_zones" ON public.search_zones FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
);

CREATE POLICY "Admins can delete search_zones" ON public.search_zones FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
);

-- Les membres peuvent seulement voir les zones de leur équipe
CREATE POLICY "Members can view their team search_zones" ON public.search_zones FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.team_members WHERE team_members.team_id = search_zones.team_id AND team_members.user_id = auth.uid())
);

-- Enable real-time for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_locations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.search_zones;
