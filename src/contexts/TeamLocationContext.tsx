import React, { createContext, useContext, ReactNode } from 'react';
import { useTeamLocations, TeamLocation } from '../hooks/useTeamLocations';
import { useGpsReporter } from '../hooks/useGpsReporter';

interface TeamLocationContextType {
  locations: TeamLocation[];
  loading: boolean;
  sendLocation: (teamId: string, lat: number, lng: number) => Promise<void>;
}

const TeamLocationContext = createContext<TeamLocationContextType | undefined>(undefined);

export function TeamLocationProvider({ children, teamId }: { children: ReactNode; teamId?: string }) {
  const { locations, loading, sendLocation } = useTeamLocations(teamId);
  
  // Optionally enable the GPS reporter here for the team member
  // useGpsReporter(teamId, 10000); // 10 seconds interval

  return (
    <TeamLocationContext.Provider value={{ locations, loading, sendLocation }}>
      {children}
    </TeamLocationContext.Provider>
  );
}

export function useTeamLocationContext() {
  const context = useContext(TeamLocationContext);
  if (context === undefined) {
    throw new Error('useTeamLocationContext must be used within a TeamLocationProvider');
  }
  return context;
}
