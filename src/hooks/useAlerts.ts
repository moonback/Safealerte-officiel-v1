import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface AlertData {
  id: string;
  type: string;
  name: string;
  age: number;
  height: string;
  weight?: string;
  clothing?: string;
  eyeColor: string;
  hairColor: string;
  description: string;
  suspectVehicle: string;
  dangerLevel: string;
  status: string;
  location: string;
  coordinates: { lat: number; lng: number };
  photoUrl: string;
  lastSeen: string;
  distance?: string;
  created_at: string;
}

export function useAlerts() {
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        const mapped: AlertData[] = data.map(d => {
          const photoMatch = d.description?.match(/Photo:\s*(https:\/\/[^\s]+)/);
          const photoUrl = photoMatch ? photoMatch[1].trim() : 'https://i.pravatar.cc/300?img=43';
          
          let cleanDesc = d.description || '';
          
          const eyesMatch = cleanDesc.match(/Yeux:\s*([^\n]+)/);
          const hairMatch = cleanDesc.match(/Cheveux:\s*([^\n]+)/);
          const weightMatch = cleanDesc.match(/Poids approx:\s*([^\n]+)/);
          const clothMatch = cleanDesc.match(/Tenue:\s*([^\n]+)/);
          
          const eyeColor = eyesMatch ? eyesMatch[1].trim() : 'Non précisé';
          const hairColor = hairMatch ? hairMatch[1].trim() : 'Non précisé';
          const weight = weightMatch ? weightMatch[1].trim() : null;
          const clothing = clothMatch ? clothMatch[1].trim() : null;

          cleanDesc = cleanDesc
            .replace(/Photo:\s*https:\/\/[^\s]+/, '')
            .replace(/Yeux:\s*[^\n]+/, '')
            .replace(/Cheveux:\s*[^\n]+/, '')
            .replace(/Poids approx:\s*[^\n]+/, '')
            .replace(/Tenue:\s*[^\n]+/, '')
            .trim();

          return {
            id: d.id,
            type: d.type || 'missing_person',
            name: d.victim_name || 'Inconnu',
            age: d.age || 0,
            height: d.height || 'Non précisé',
            weight: weight || undefined,
            clothing: clothing || undefined,
            eyeColor: eyeColor,
            hairColor: hairColor,
            lastSeen: d.missing_since || d.created_at,
            location: d.location || 'Localisation inconnue',
            description: cleanDesc,
            suspectVehicle: d.suspect_vehicle || '',
            dangerLevel: d.danger_level || 'MOYEN',
            status: d.status || 'EN COURS',
            coordinates: { lat: d.latitude || 45.75, lng: d.longitude || 4.85 },
            photoUrl: photoUrl,
            created_at: d.created_at
          };
        });
        setAlerts(mapped);
      } else {
        setAlerts([]);
      }
    } catch (err) {
      console.error('Error fetching alerts:', err);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  return { alerts, loading, refetch: fetchAlerts };
}
