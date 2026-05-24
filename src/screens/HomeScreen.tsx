import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Shield, Eye, MapPin, ChevronRight, Map as MapIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { useAlerts } from '../hooks/useAlerts';
import { supabase } from '../lib/supabase';

export default function HomeScreen() {
  const navigate = useNavigate();
  const { alerts, loading } = useAlerts();
  const [activity, setActivity] = useState<any[]>([]);
  const [activeTeams, setActiveTeams] = useState<any[]>([]);
  
  const mainAlert = alerts[0];

  useEffect(() => {
    const fetchActivity = async () => {
      const { data } = await supabase
        .from('reports')
        .select('*, profiles:user_id(name)')
        .order('created_at', { ascending: false })
        .limit(3);
        
      if (data) {
        setActivity(data);
      }
    };
    
    const fetchTeams = async () => {
      const { data } = await supabase
        .from('teams')
        .select('*, team_members(count)')
        .order('created_at', { ascending: false })
        .limit(3);
      if (data) setActiveTeams(data);
    };

    fetchActivity();
    fetchTeams();

    const channel = supabase.channel('public:reports')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reports' }, payload => {
        const fetchNewReport = async () => {
          const { data } = await supabase.from('reports').select('*, profiles:user_id(name)').eq('id', payload.new.id).single();
          if (data) {
            setActivity(prev => [data, ...prev].slice(0, 3));
          }
        };
        fetchNewReport();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen pb-24">
      {/* Header */}
      <header className="flex justify-between items-center px-6 py-5 pt-8">
        <div className="flex items-center gap-2">
          <Shield className="text-safe-red" size={28} />
          <span className="text-xl font-bold tracking-tight">Safe<span className="text-safe-red">Alert</span></span>
        </div>
        <button className="relative p-2 bg-safe-card rounded-full">
          <Bell size={20} className="text-white" />
          <span className="absolute top-1.5 right-2 w-2 h-2 bg-safe-red rounded-full" />
        </button>
      </header>

      {/* Main Alert Banner */}
      {mainAlert ? (
        <div className="px-5 mb-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-safe-red to-safe-red-hover rounded-2xl p-5 shadow-[0_10px_30px_rgba(229,57,53,0.3)]"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="animate-pulse w-2.5 h-2.5 bg-white rounded-full" />
              <span className="text-white/90 text-xs font-bold tracking-wider uppercase">Alerte en cours</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">{mainAlert.type === 'child_abduction' ? "Enlèvement d'enfant" : "Personne disparue"}</h2>
            <div className="flex items-center gap-1.5 text-white/80 text-sm mb-4">
              <MapPin size={14} />
              <span>{mainAlert.location} • {new Date(mainAlert.lastSeen).toLocaleDateString()}</span>
            </div>
            <button 
              onClick={() => navigate(`/alert/${mainAlert.id}`)}
              className="w-full bg-white text-safe-red font-bold py-3 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              Voir l'alerte
              <ChevronRight size={18} />
            </button>
          </motion.div>
        </div>
      ) : (
        <div className="px-5 mb-6">
           <div className="bg-safe-card border border-safe-border rounded-2xl p-6 text-center text-gray-400">
             <Shield className="mx-auto mb-2 text-safe-green" size={32} />
             <p className="font-semibold text-white">Aucune alerte en cours</p>
             <p className="text-sm mt-1">Situation normale dans votre région.</p>
           </div>
        </div>
      )}

      {/* Mini Map Placeholder */}
      <div className="px-5 mb-6">
        <div 
          onClick={() => navigate('/map')}
          className="relative w-full h-32 bg-[#1A1A1A] rounded-2xl overflow-hidden border border-safe-border flex items-center justify-center cursor-pointer"
        >
          {/* Faux map grid background */}
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
          
          <MapIcon size={32} className="text-gray-600 mb-2" />
          
          {/* Animated Map Pin */}
          <div className="absolute z-10 flex flex-col items-center">
            <div className="relative flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-safe-red opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-safe-red border-2 border-white"></span>
            </div>
            <span className="mt-2 bg-safe-dark/80 px-2 py-1 rounded text-[10px] text-white">Près de vous</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-5 flex gap-4 mb-8">
        <button 
          onClick={() => navigate('/report/step-1')}
          className="flex-1 bg-safe-card border border-safe-border rounded-2xl p-4 flex flex-col items-center justify-center gap-3 active:bg-safe-border transition-colors"
        >
          <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-400">
            <Eye size={24} />
          </div>
          <span className="text-sm font-medium">Signalement</span>
        </button>
        <button className="flex-1 bg-safe-card border border-safe-border rounded-2xl p-4 flex flex-col items-center justify-center gap-3 active:bg-safe-border transition-colors">
          <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center text-green-400">
            <Shield size={24} />
          </div>
          <span className="text-sm font-medium">Conseils</span>
        </button>
      </div>

      {/* Équipes Actives */}
      <div className="px-5 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Équipes de recherche</h3>
        </div>
        
        <div className="space-y-3">
          {activeTeams.length === 0 ? (
             <div className="bg-safe-card border border-safe-border p-4 rounded-xl text-center text-gray-500 text-sm">
                Aucune équipe de recherche active pour le moment.
             </div>
          ) : activeTeams.map(team => (
            <div 
              key={team.id} 
              onClick={() => navigate(`/teams/${team.id}`)}
              className="bg-safe-card p-4 rounded-xl border border-safe-border flex gap-3 items-center cursor-pointer active:bg-safe-dark transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-yellow-500/10 text-yellow-500 flex items-center justify-center font-bold">
                {team.name.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white truncate">{team.name}</p>
                <p className="text-xs text-gray-400 truncate">{team.location || 'Secteur non défini'}</p>
              </div>
              <div className="text-right">
                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                  team.status === 'En attente' ? 'bg-gray-500/20 text-gray-400' :
                  team.status === 'En intervention' ? 'bg-red-500/20 text-red-400' :
                  'bg-green-500/20 text-green-400'
                }`}>
                  {team.status}
                </span>
                <p className="text-xs text-gray-500 mt-1">{team.team_members?.[0]?.count || 0} membres</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actualités */}
      <div className="px-5 flex-1">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Activité récente</h3>
          <span className="text-xs text-gray-400">Voir tout</span>
        </div>
        
        <div className="space-y-3">
          {activity.length === 0 ? (
             <div className="text-gray-500 text-sm">Aucune activité récente.</div>
          ) : activity.map(item => (
            <div key={item.id} className="bg-safe-card p-4 rounded-xl border border-safe-border flex gap-3 items-start">
              <div className="w-8 h-8 rounded-full bg-safe-dark flex items-center justify-center text-xs font-bold text-gray-400 border border-gray-800 shrink-0">
                {(item.profiles?.name || 'A').charAt(0)}
              </div>
              <div className="flex-1">
                <p className="text-sm">
                  <span className="font-semibold text-white">{item.profiles?.name || 'Citoyen'}</span>{' '}
                  <span className="text-gray-400">a partagé un signalement ({item.report_type})</span>
                </p>
                <span className="text-xs text-gray-500 mt-1 block">{new Date(item.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
