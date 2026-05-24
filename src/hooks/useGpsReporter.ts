import { useEffect, useRef } from 'react';
import { useTeamLocations } from './useTeamLocations';

export function useGpsReporter(teamId?: string, intervalMs: number = 10000) {
  const { sendLocation } = useTeamLocations();
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!teamId || !navigator.geolocation) return;

    const reportLocation = () => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          sendLocation(teamId, position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.error('Error getting GPS location:', error);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    };

    // Initial report
    reportLocation();

    // Set interval
    intervalRef.current = window.setInterval(reportLocation, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [teamId, intervalMs, sendLocation]);
}
