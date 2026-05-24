-- Fix RLS for team_members to allow authenticated users to join teams
CREATE POLICY "Users can insert own team_members" ON public.team_members
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add alert_id to teams to explicitly link an alert
ALTER TABLE public.teams
ADD COLUMN alert_id UUID REFERENCES public.alerts(id) ON DELETE SET NULL;
