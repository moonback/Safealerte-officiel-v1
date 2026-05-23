import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Home, Map as MapIcon, PlusCircle, Bell, User } from 'lucide-react';
import { cn } from '../lib/utils';

export function MobileLayout() {
  const location = useLocation();
  const isAlertDetail = location.pathname.startsWith('/alert/');
  const isTeamDetail = location.pathname.startsWith('/teams/');
  const isProfileInfo = location.pathname.startsWith('/profile/info');
  const hideBottomNav = ['/', '/onboarding', '/login', '/report/step-1', '/report/step-2', '/report/step-3'].includes(location.pathname) || isAlertDetail || isTeamDetail || isProfileInfo;

  return (
    <div className="flex justify-center w-full min-h-screen bg-safe-dark text-white">
      {/* Mobile Frame Container */}
      <div className="w-full max-w-md bg-safe-dark min-h-screen flex flex-col relative overflow-hidden ring-1 ring-safe-border/50 shadow-2xl xl:rounded-3xl xl:h-[850px] xl:my-10 xl:min-h-0">
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto w-full pb-20 scroll-smooth">
          <Outlet />
        </main>

        {/* Bottom Navigation */}
        {!hideBottomNav && (
          <nav className="absolute bottom-0 w-full bg-[#121212]/95 backdrop-blur-md border-t border-safe-border px-6 py-4 pb-safe flex justify-between items-center z-50">
            <NavItem to="/home" icon={<Home size={24} />} label="Accueil" />
            <NavItem to="/map" icon={<MapIcon size={24} />} label="Carte" />
            
            {/* Center Report Button */}
            <NavLink
              to="/report/step-1"
              className="relative -top-5 flex flex-col items-center justify-center w-14 h-14 bg-safe-red rounded-full shadow-[0_0_20px_rgba(229,57,53,0.4)] text-white hover:bg-safe-red-hover transition-colors"
            >
              <PlusCircle size={30} strokeWidth={2} />
            </NavLink>

            <NavItem to="/alerts" icon={<Bell size={24} />} label="Alertes" />
            <NavItem to="/profile" icon={<User size={24} />} label="Profil" />
          </nav>
        )}
      </div>
    </div>
  );
}

function NavItem({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex flex-col items-center gap-1 transition-colors",
          isActive ? "text-safe-red" : "text-gray-500 hover:text-gray-300"
        )
      }
    >
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </NavLink>
  );
}
