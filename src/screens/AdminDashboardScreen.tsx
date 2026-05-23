import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Bell, Users, Map as MapIcon, MessageSquare, BarChart, Settings, Clock, Activity, Search, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAlerts } from '../hooks/useAlerts';
import MapScreen from './MapScreen';
import AdminLayout from '../components/AdminLayout';

export default function AdminDashboardScreen() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'alerts' | 'reports' | 'map' | 'teams'>('dashboard');
  const [stats, setStats] = useState({
    activeAlerts: 0,
    reports: 0,
    teams: 0,
  });
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      // Fetch alerts
      const { count: alertsCount } = await supabase
        .from('alerts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'EN COURS');
      
      // Fetch reports
      const { count: reportsCount } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true });
        
      // Fetch teams
      const { count: teamsCount } = await supabase
        .from('teams')
        .select('*', { count: 'exact', head: true });

      setStats({
        activeAlerts: alertsCount || 0,
        reports: reportsCount || 0,
        teams: teamsCount || 0,
      });

      // Fetch recent reports and team creations to form a timeline
      const { data: recentReports } = await supabase
        .from('reports')
        .select('*, profiles:user_id(name)')
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentReports) {
        setActivities(recentReports);
      }
    };

    fetchDashboardData();

    const channel = supabase.channel('public:reports')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reports' }, payload => {
        const fetchNewReport = async () => {
          const { data } = await supabase.from('reports').select('*, profiles:user_id(name)').eq('id', payload.new.id).single();
          if (data) {
            setActivities(prev => [data, ...prev].slice(0, 5));
            setStats(prev => ({ ...prev, reports: prev.reports + 1 }));
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
    <AdminLayout activeTab={activeTab} onTabChange={setActiveTab}>
      <div className="p-4 lg:p-8 flex-1 flex flex-col h-full w-full">
        {activeTab === 'dashboard' && (
          <AdminDashboardView stats={stats} activities={activities} />
        )}
        {activeTab === 'alerts' && (
          <AdminAlertsView />
        )}
        {activeTab === 'reports' && (
          <AdminReportsView />
        )}
        {activeTab === 'teams' && (
          <AdminTeamsView />
        )}
        {activeTab === 'map' && (
          <div className="flex-1 bg-safe-card border border-safe-border rounded-3xl overflow-hidden relative min-h-[500px]">
            <MapScreen />
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function AdminDashboardView({ stats, activities }: any) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 lg:gap-6 mb-8">
        <StatCard label="Alertes Actives" value={stats.activeAlerts} trend="En cours" color="text-safe-red" border="border-safe-red/20" bg="bg-safe-red/5" icon={Shield} />
        <StatCard label="Signalements" value={stats.reports} trend="Total" color="text-blue-500" border="border-blue-500/20" bg="bg-blue-500/5" icon={Bell} />
        <StatCard label="Équipes déployées" value={stats.teams} trend="Dispo" color="text-yellow-500" border="border-yellow-500/20" bg="bg-yellow-500/5" icon={MapIcon} />
        <StatCard label="Personnes retrouvées" value="0" trend="Total mois" color="text-safe-green" border="border-safe-green/20" bg="bg-safe-green/5" icon={Users} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Live Map (Placeholder) */}
        <div className="xl:col-span-2 bg-safe-card border border-safe-border rounded-3xl p-6 flex flex-col min-h-[400px]">
           <div className="flex justify-between items-center mb-6">
             <h2 className="text-lg font-bold flex items-center gap-2"><MapIcon size={20} className="text-safe-red"/> Aperçu Cartographique</h2>
             <span className="px-3 py-1 bg-safe-red/10 text-safe-red rounded-full text-xs font-bold animate-pulse">EN DIRECT</span>
           </div>
           
           <div className="flex-1 bg-black rounded-2xl border border-safe-border relative overflow-hidden flex items-center justify-center">
             <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at center, #666 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
             <span className="text-gray-600 font-mono">Module Cartographie Active</span>
           </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="bg-safe-card border border-safe-border rounded-3xl p-6 shadow-lg overflow-y-auto max-h-[500px]">
           <h2 className="text-lg font-bold mb-6 flex items-center gap-2"><Clock size={20} /> Journal d'activité</h2>
           
           <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-safe-border before:to-transparent">
              {activities.length === 0 ? (
                <div className="text-center text-gray-500 pt-4">Aucune activité récente.</div>
              ) : (
                activities.map((act: any, idx: number) => (
                  <Link key={act.id} to={act.alert_id ? `/alert/${act.alert_id}` : "#"}>
                    <ActivityItem 
                      time={new Date(act.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} 
                      user={act.profiles?.name || 'Citoyen'} 
                      text={`Signalement - ${act.report_type}`} 
                      type="report" 
                      isLast={idx === activities.length - 1} 
                    />
                  </Link>
                ))
              )}
           </div>
        </div>
      </div>
    </>
  )
}

function AdminAlertsView() {
  const { alerts, loading } = useAlerts();
  const navigate = useNavigate();
  if (loading) return <div className="flex justify-center p-10"><div className="animate-spin w-8 h-8 border-4 border-safe-red border-t-transparent rounded-full" /></div>;
  
  return (
    <div className="bg-safe-card border border-safe-border rounded-3xl p-6 overflow-y-auto">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Bell className="text-safe-red" /> Gestion des Alertes</h2>
      <div className="space-y-4">
        {alerts.map(alert => (
          <div key={alert.id} onClick={() => navigate(`/alert/${alert.id}`)} className="flex items-center justify-between p-4 bg-safe-dark border border-safe-border rounded-2xl cursor-pointer hover:border-safe-red transition-colors group">
            <div className="flex gap-4 items-center">
              <img src={alert.photoUrl} alt="" className="w-12 h-12 rounded-xl object-cover" />
              <div>
                <h3 className="font-bold text-white text-lg">{alert.name}</h3>
                <p className="text-sm text-gray-400">{alert.location}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${alert.status === 'EN COURS' ? 'bg-safe-red/20 text-safe-red' : 'bg-gray-800 text-gray-400'}`}>{alert.status}</span>
              <ChevronRight className="text-gray-500 group-hover:text-white transition-colors" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function AdminReportsView() {
  const [reports, setReports] = useState<any[]>([]);
  useEffect(() => {
    supabase.from('reports').select('*, profiles:user_id(name)').order('created_at', { ascending: false }).then(({data}) => {
      if (data) {
        const mapped = data.map(r => {
          const mediaMatch = r.description?.match(/Media: (https:\/\/[^\s]+)/);
          const mediaUrl = mediaMatch ? mediaMatch[1].trim() : null;
          const cleanDescription = r.description ? r.description.replace(/Media: https:\/\/[^\s]+/, '').trim() : '';
          return { ...r, media_url: mediaUrl, clean_description: cleanDescription };
        });
        setReports(mapped);
      }
    });
  }, []);

  return (
    <div className="bg-safe-card border border-safe-border rounded-3xl p-6 overflow-y-auto">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><MessageSquare className="text-blue-500" /> Flux des Signalements</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map(report => (
          <div key={report.id} className="bg-safe-dark border border-safe-border rounded-2xl p-4 flex flex-col gap-3">
             <div className="flex justify-between items-start">
               <div>
                  <span className="text-xs font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded uppercase">{report.report_type}</span>
                  <p className="text-xs text-gray-400 mt-1">{new Date(report.created_at).toLocaleString()}</p>
               </div>
               <span className="text-sm font-bold text-white">{report.profiles?.name || 'Anonyme'}</span>
             </div>
             {report.media_url && <img src={report.media_url} alt="" className="w-full h-32 object-cover rounded-xl" />}
             {report.location && <p className="text-sm text-gray-300 font-mono bg-black/30 p-2 rounded-lg">{report.location}</p>}
             {report.clean_description && <p className="text-sm text-white italic">"{report.clean_description}"</p>}
          </div>
        ))}
      </div>
    </div>
  )
}

function AdminTeamsView() {
  const [teams, setTeams] = useState<any[]>([]);
  const navigate = useNavigate();
  useEffect(() => {
    supabase.from('teams').select('*').order('created_at', { ascending: false }).then(({data}) => setTeams(data || []));
  }, []);

  return (
    <div className="bg-safe-card border border-safe-border rounded-3xl p-6 overflow-y-auto">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Users className="text-yellow-500" /> Équipes de Recherche</h2>
      <div className="space-y-4">
        {teams.map(team => (
          <div key={team.id} onClick={() => navigate(`/teams/${team.id}`)} className="flex items-center justify-between p-4 bg-safe-dark border border-safe-border rounded-2xl cursor-pointer hover:border-yellow-500 transition-colors group">
            <div className="flex gap-4 items-center">
              <div className="w-12 h-12 bg-yellow-500/20 text-yellow-500 rounded-xl flex items-center justify-center font-bold text-xl uppercase">
                {team.name.substring(0, 2)}
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">{team.name}</h3>
                <p className="text-sm text-gray-400">{team.status}</p>
              </div>
            </div>
            <ChevronRight className="text-gray-500 group-hover:text-white transition-colors" />
          </div>
        ))}
      </div>
    </div>
  )
}

function SidebarItem({ icon: Icon, label, active, badge }: any) {
  return (
    <div className={`flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-colors ${active ? 'bg-safe-red text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
      <div className="flex items-center gap-3">
        <Icon size={20} />
        <span className="font-semibold text-sm">{label}</span>
      </div>
      {badge && (
        <span className="bg-safe-red rounded-full px-2 py-0.5 text-[10px] font-bold text-white">{badge}</span>
      )}
    </div>
  );
}

function StatCard({ label, value, trend, color, border, bg, icon: Icon }: any) {
  return (
    <div className={`border ${border} ${bg} rounded-3xl p-6 flex flex-col`}>
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl bg-black/40 ${color}`}>
          <Icon size={24} />
        </div>
        <span className="text-xs font-bold text-gray-400 bg-black/40 px-2 py-1 rounded-full">{trend}</span>
      </div>
      <span className="text-gray-400 text-sm font-medium mb-1">{label}</span>
      <span className={`text-4xl font-black ${color}`}>{value}</span>
    </div>
  )
}

function ActivityItem({ time, user, text, type, isLast }: any) {
  const colors = {
    team: 'bg-green-500',
    report: 'bg-blue-500',
    alert: 'bg-safe-red',
  }[type as string];

  return (
    <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active cursor-pointer hover:opacity-80 transition-opacity">
        <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-safe-card ${colors} text-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow font-bold text-xs`}>
            {(user || 'U').charAt(0)}
        </div>
        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-safe-dark border border-safe-border p-4 rounded-xl shadow">
            <div className="flex justify-between mb-1">
                <span className="font-bold text-sm truncate max-w-[100px]">{user}</span>
                <span className="text-xs text-gray-500 shrink-0">{time}</span>
            </div>
            <p className="text-sm text-gray-400 truncate">{text}</p>
        </div>
    </div>
  )
}

