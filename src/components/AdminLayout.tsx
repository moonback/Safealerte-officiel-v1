import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Shield, Bell, Users, Map as MapIcon, MessageSquare, Activity, Settings, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';

function SidebarItem({ icon: Icon, label, active, badge }: any) {
  return (
    <div className={`flex items-center justify-between px-4 py-3 rounded-xl transition-colors cursor-pointer ${active ? 'bg-safe-red text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
      <div className="flex items-center gap-3">
        <Icon size={20} className={active ? 'text-white' : 'text-gray-500'} />
        <span className="font-bold text-sm">{label}</span>
      </div>
      {badge !== undefined && (
        <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${active ? 'bg-white/20 text-white' : 'bg-gray-800 text-gray-400'}`}>
          {badge}
        </span>
      )}
    </div>
  );
}

export default function AdminLayout({ children, activeTab, onTabChange, hideHeader = false }: any) {
  const navigate = useNavigate();
  const location = useLocation();
  const [stats, setStats] = useState({ activeAlerts: 0, reports: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const { count: activeCount } = await supabase.from('alerts').select('*', { count: 'exact', head: true }).eq('status', 'EN COURS');
      const { count: reportsCount } = await supabase.from('reports').select('*', { count: 'exact', head: true });
      
      setStats({
        activeAlerts: activeCount || 0,
        reports: reportsCount || 0,
      });
    };
    fetchStats();
  }, []);

  const handleTabClick = (tab: string) => {
    if (onTabChange) {
       onTabChange(tab);
    } else {
       navigate('/admin'); // If we are on new alert and click a tab, go back to admin
    }
  };

  const isTabActive = (tab: string) => {
     if (location.pathname === '/admin/new-alert' && tab === 'new-alert') return true;
     return activeTab === tab;
  }

  return (
    <div className="flex h-screen bg-safe-dark text-white overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-safe-card border-r border-safe-border flex flex-col hidden lg:flex">
        <div className="p-6 flex items-center gap-3">
          <Shield className="text-safe-red" size={32} />
          <span className="text-2xl font-bold tracking-tight">Safe<span className="text-safe-red">Alert</span></span>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2">
           <div onClick={() => handleTabClick('dashboard')}><SidebarItem icon={Activity} label="Tableau de bord" active={isTabActive('dashboard')} /></div>
           <div onClick={() => handleTabClick('alerts')}><SidebarItem icon={Bell} label="Alertes" badge={stats.activeAlerts.toString()} active={isTabActive('alerts')} /></div>
           <div onClick={() => handleTabClick('reports')}><SidebarItem icon={MessageSquare} label="Signalements" badge={stats.reports.toString()} active={isTabActive('reports')} /></div>
           <div onClick={() => handleTabClick('map')}><SidebarItem icon={MapIcon} label="Carte en direct" active={isTabActive('map')} /></div>
           <div onClick={() => handleTabClick('teams')}><SidebarItem icon={Users} label="Équipes" active={isTabActive('teams')} /></div>
        </nav>
        
        <div className="p-4 border-t border-safe-border space-y-2">
          <Link to="/app">
            <SidebarItem icon={MapIcon} label="Vue Citoyen" />
          </Link>
          <div onClick={() => navigate('/profile')}>
             <SidebarItem icon={Settings} label="Paramètres du compte" />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-y-auto w-full">
        {/* Topbar */}
        {!hideHeader && (
          <header className="h-20 border-b border-safe-border flex min-h-[5rem] items-center justify-between px-4 lg:px-8 bg-safe-dark sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate('/app')} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors lg:hidden">
                 <MapIcon size={20} />
              </button>
              <div>
                <h1 className="text-xl lg:text-2xl font-bold">Vue d'ensemble</h1>
                <p className="text-xs lg:text-sm text-gray-400 font-medium">Centre de Crise</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 lg:gap-6">
              <div className="relative hidden lg:block">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                 <input 
                   type="text" 
                   placeholder="Rechercher..." 
                   className="bg-safe-card border border-safe-border rounded-full pl-10 pr-4 py-2 w-72 text-sm focus:outline-none focus:border-safe-red"
                 />
              </div>
              <button 
                onClick={() => navigate('/admin/new-alert')} 
                className="bg-safe-red hover:bg-safe-red-hover transition-colors text-white px-3 lg:px-5 py-2 lg:py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(229,57,53,0.3)] text-sm lg:text-base"
              >
                <Shield size={18} /> <span className="hidden sm:inline">Lancer une Alerte</span>
              </button>
              <div className="w-10 h-10 bg-safe-dark border border-safe-border rounded-full flex items-center justify-center font-bold hidden lg:flex">
                A
              </div>
            </div>
          </header>
        )}
        
        {children}
      </main>
    </div>
  );
}
