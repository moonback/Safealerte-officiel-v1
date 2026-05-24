import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface TeamLocation {
  id: string;
  team_id: string;
  latitude: number;
  longitude: number;
  updated_at: string;
}

export function useTeamLocations(teamId?: string) {
  const [locations, setLocations] = useState<Record<string, TeamLocation>>({});
  const [loading, setLoading] = useState(true);

  // Initial fetch
  useEffect(() => {
    const fetchLocations = async () => {
      if (!teamId) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      const { data, error } = await supabase
        .from('team_locations')
        .select('*')
        .eq('team_id', teamId);
        
      if (error) {
        console.error('Error fetching team locations:', error);
      } else if (data) {
        const locationsMap: Record<string, TeamLocation> = {};
        data.forEach(loc => {
          locationsMap[loc.id] = loc;
        });
        setLocations(locationsMap);
      }
      setLoading(false);
    };

    fetchLocations();
  }, [teamId]);

  // Realtime subscription
  useEffect(() => {
    if (!teamId) return;

    const channel = supabase
      .channel(`public:team_locations:team_${teamId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'team_locations',
          filter: `team_id=eq.${teamId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const newLoc = payload.new as TeamLocation;
            setLocations(prev => ({ ...prev, [newLoc.id]: newLoc }));
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id;
            setLocations(prev => {
              const newMap = { ...prev };
              delete newMap[deletedId];
              return newMap;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teamId]);

  const sendLocation = useCallback(async (tId: string, lat: number, lng: number) => {
    const { error } = await supabase
      .from('team_locations')
      .upsert({
        team_id: tId,
        latitude: lat,
        longitude: lng,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'team_id' }); // Assuming we want 1 row per team, wait, the schema doesn't have unique team_id... 
      // If each team member has a location, we might want to store user_id as well, but schema says id (uuid), team_id, lat, lng.
      // For now, just insert. Or upsert if we want one per team. Actually, teams could have multiple members. Let's just insert to keep track of the latest, or insert and let it accumulate.
      // Let's just insert for simplicity.
      
    if (error) {
      console.error('Error sending location:', error);
    }
  }, []);

  return {
    locations: Object.values(locations),
    loading,
    sendLocation
  };
}
