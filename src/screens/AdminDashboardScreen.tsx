import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Shield, Bell, Users, Map as MapIcon, MapPin, MessageSquare,
  Clock, Activity, Search, ChevronRight, Edit2, Trash2,
  Filter, SlidersHorizontal, CheckCircle2, AlertTriangle,
  Eye, X, ArrowUpDown, ChevronDown, RefreshCw, Plus,
  UserX, Car, Calendar, Crosshair, CheckSquare, Square,
  ToggleLeft, ToggleRight, Radio, FileText
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAlerts, AlertData } from '../hooks/useAlerts';
import MapScreen from './MapScreen';
import AdminLayout from '../components/AdminLayout';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

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
          <AdminDashboardView stats={stats} activities={activities} onOpenMap={() => setActiveTab('map')} />
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

// ─── Custom icon for dashboard mini-map ─────────────────────
const dashAlertIcon = new L.DivIcon({
  html: `<div style="position:relative;display:flex;width:32px;height:32px">
    <span style="position:absolute;display:inline-flex;width:100%;height:100%;border-radius:50%;background:rgba(229,57,53,0.5);animation:ping 1.5s cubic-bezier(0,0,.2,1) infinite"></span>
    <span style="position:relative;display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:50%;background:#e53935;border:2px solid white;box-shadow:0 4px 12px rgba(229,57,53,0.6)">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
    </span>
  </div>`,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const dashResolvedIcon = new L.DivIcon({
  html: `<div style="display:flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;background:#22c55e;border:2px solid white;box-shadow:0 2px 8px rgba(34,197,94,0.4)">
    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
  </div>`,
  className: '',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

// ─── Dashboard Map Card ──────────────────────────────────────
function DashboardMapCard({ stats, onOpenMap }: { stats: any; onOpenMap: () => void }) {
  const { alerts } = useAlerts();
  const [reports, setReports] = useState<any[]>([]);
  const [tick, setTick] = useState(0);

  // Refresh time indicator every minute
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 60_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    supabase.from('reports').select('latitude, longitude, report_type, created_at').not('latitude', 'is', null).then(({ data }) => {
      if (data) setReports(data);
    });
  }, []);

  const activeAlerts  = alerts.filter(a => a.status === 'EN COURS');
  const resolvedAlerts = alerts.filter(a => a.status !== 'EN COURS');
  const now = new Date();
  const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="xl:col-span-2 bg-safe-card border border-safe-border rounded-3xl flex flex-col min-h-[420px] overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center px-6 py-4 border-b border-safe-border shrink-0">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <MapIcon size={20} className="text-safe-red" />
          Aperçu Cartographique
        </h2>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs font-bold text-green-400">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-ping" />
            LIVE · {timeStr}
          </span>
          <button
            onClick={onOpenMap}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-safe-red/10 text-safe-red hover:bg-safe-red/20 border border-safe-red/20 rounded-xl transition-colors"
          >
            <Eye size={13} />
            Plein écran
          </button>
        </div>
      </div>

      {/* Map */}
      <div className="relative flex-1 min-h-[320px]">
        <MapContainer
          center={[46.603354, 1.888334]}
          zoom={6}
          style={{ height: '100%', width: '100%', minHeight: '320px', background: '#0a0a0a' }}
          zoomControl={false}
          scrollWheelZoom={false}
          dragging={true}
          attributionControl={false}
        >
          {/* Satellite tile */}
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution=""
          />

          {/* Active alerts — animated red */}
          {activeAlerts.map(alert => (
            <Marker
              key={alert.id}
              position={[alert.coordinates.lat, alert.coordinates.lng]}
              icon={dashAlertIcon}
            >
              <Popup>
                <div style={{ minWidth: 160, background: '#1a1a1a', color: 'white', borderRadius: 12, padding: '10px 12px', border: '1px solid #333' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <img src={alert.photoUrl} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover' }} />
                    <div>
                      <p style={{ fontWeight: 700, fontSize: 13, margin: 0 }}>{alert.name}</p>
                      <p style={{ fontSize: 11, color: '#f87171', fontWeight: 600, margin: 0 }}>🔴 EN COURS</p>
                    </div>
                  </div>
                  <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>📍 {alert.location}</p>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Resolved alerts — green */}
          {resolvedAlerts.map(alert => (
            <Marker
              key={alert.id + '_r'}
              position={[alert.coordinates.lat, alert.coordinates.lng]}
              icon={dashResolvedIcon}
            >
              <Popup>
                <div style={{ minWidth: 140, background: '#1a1a1a', color: 'white', borderRadius: 12, padding: '8px 12px', border: '1px solid #333' }}>
                  <p style={{ fontWeight: 700, fontSize: 12, margin: 0 }}>{alert.name}</p>
                  <p style={{ fontSize: 11, color: '#4ade80', margin: '2px 0 0' }}>✅ RÉSOLUE</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Stats overlay — bottom-left */}
        <div style={{
          position: 'absolute', bottom: 12, left: 12, zIndex: 1000,
          display: 'flex', gap: 8, pointerEvents: 'none',
        }}>
          <div style={{ background: 'rgba(229,57,53,0.9)', backdropFilter: 'blur(8px)', borderRadius: 12, padding: '6px 12px', border: '1px solid rgba(255,255,255,0.15)' }}>
            <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>En cours</p>
            <p style={{ fontSize: 20, fontWeight: 900, color: 'white', margin: 0, lineHeight: 1.1 }}>{activeAlerts.length}</p>
          </div>
          <div style={{ background: 'rgba(34,197,94,0.85)', backdropFilter: 'blur(8px)', borderRadius: 12, padding: '6px 12px', border: '1px solid rgba(255,255,255,0.15)' }}>
            <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Résolues</p>
            <p style={{ fontSize: 20, fontWeight: 900, color: 'white', margin: 0, lineHeight: 1.1 }}>{resolvedAlerts.length}</p>
          </div>
          <div style={{ background: 'rgba(59,130,246,0.85)', backdropFilter: 'blur(8px)', borderRadius: 12, padding: '6px 12px', border: '1px solid rgba(255,255,255,0.15)' }}>
            <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Signalements</p>
            <p style={{ fontSize: 20, fontWeight: 900, color: 'white', margin: 0, lineHeight: 1.1 }}>{reports.length}</p>
          </div>
        </div>

        {/* Legend — top-right */}
        <div style={{
          position: 'absolute', top: 12, right: 12, zIndex: 1000,
          background: 'rgba(10,10,10,0.85)', backdropFilter: 'blur(8px)',
          borderRadius: 12, padding: '8px 12px', border: '1px solid rgba(255,255,255,0.1)',
          pointerEvents: 'none',
        }}>
          <p style={{ fontSize: 9, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 6px' }}>Légende</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444', display: 'inline-block', boxShadow: '0 0 6px rgba(239,68,68,0.8)' }} />
              <span style={{ fontSize: 11, color: '#d1d5db' }}>Alerte active</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
              <span style={{ fontSize: 11, color: '#d1d5db' }}>Résolue</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminDashboardView({ stats, activities, onOpenMap }: any) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 lg:gap-6 mb-8">
        <StatCard label="Alertes Actives" value={stats.activeAlerts} trend="En cours" color="text-safe-red" border="border-safe-red/20" bg="bg-safe-red/5" icon={Shield} />
        <StatCard label="Signalements" value={stats.reports} trend="Total" color="text-blue-500" border="border-blue-500/20" bg="bg-blue-500/5" icon={Bell} />
        <StatCard label="Équipes déployées" value={stats.teams} trend="Dispo" color="text-yellow-500" border="border-yellow-500/20" bg="bg-yellow-500/5" icon={MapIcon} />
        <StatCard label="Personnes retrouvées" value="0" trend="Total mois" color="text-safe-green" border="border-safe-green/20" bg="bg-safe-green/5" icon={Users} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Live Map — Real Leaflet */}
        <DashboardMapCard stats={stats} onOpenMap={onOpenMap} />

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

// ─── Danger level helpers ───────────────────────────────────
const DANGER_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  CRITIQUE: { label: 'CRITIQUE', color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/30',    dot: 'bg-red-500' },
  ÉLEVÉ:    { label: 'ÉLEVÉ',    color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30', dot: 'bg-orange-500' },
  MOYEN:    { label: 'MOYEN',    color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30', dot: 'bg-yellow-500' },
  FAIBLE:   { label: 'FAIBLE',   color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/30',  dot: 'bg-green-500' },
};

function DangerBadge({ level }: { level: string }) {
  const cfg = DANGER_CONFIG[level?.toUpperCase()] ?? DANGER_CONFIG['MOYEN'];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${cfg.bg} ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ─── Main Alert Management View ──────────────────────────────
function AdminAlertsView() {
  const { alerts, loading, refetch } = useAlerts();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'EN COURS' | 'RESOLUE'>('ALL');
  const [dangerFilter, setDangerFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [sortField, setSortField] = useState<'name' | 'created_at' | 'dangerLevel'>('created_at');
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [panelAlert, setPanelAlert] = useState<AlertData | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  // ── Filtered & sorted list ──
  const filtered = useMemo(() => {
    const dangerOrder: Record<string, number> = { CRITIQUE: 0, ÉLEVÉ: 1, MOYEN: 2, FAIBLE: 3 };
    return alerts
      .filter(a => {
        const q = search.toLowerCase();
        const matchSearch = !q || a.name.toLowerCase().includes(q) || a.location.toLowerCase().includes(q);
        const matchStatus = statusFilter === 'ALL' || a.status === statusFilter;
        const matchDanger = dangerFilter === 'ALL' || (a.dangerLevel || '').toUpperCase() === dangerFilter;
        const matchType = typeFilter === 'ALL' || a.type === typeFilter;
        return matchSearch && matchStatus && matchDanger && matchType;
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortField === 'name') cmp = a.name.localeCompare(b.name);
        else if (sortField === 'created_at') cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        else if (sortField === 'dangerLevel') cmp = (dangerOrder[a.dangerLevel?.toUpperCase()] ?? 2) - (dangerOrder[b.dangerLevel?.toUpperCase()] ?? 2);
        return sortAsc ? cmp : -cmp;
      });
  }, [alerts, search, statusFilter, dangerFilter, typeFilter, sortField, sortAsc]);

  // Summary counts
  const enCours = alerts.filter(a => a.status === 'EN COURS').length;
  const resolues = alerts.filter(a => a.status !== 'EN COURS').length;
  const critiques = alerts.filter(a => (a.dangerLevel || '').toUpperCase() === 'CRITIQUE').length;

  // ── Delete one ──
  const handleDelete = useCallback(async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm('Supprimer cette alerte définitivement ?')) return;
    setDeletingIds(p => new Set(p).add(id));
    await supabase.from('alerts').delete().eq('id', id);
    setDeletingIds(p => { const n = new Set(p); n.delete(id); return n; });
    if (panelAlert?.id === id) setPanelAlert(null);
    refetch?.();
  }, [panelAlert, refetch]);

  // ── Bulk delete ──
  const handleBulkDelete = useCallback(async () => {
    if (!selectedIds.size || !window.confirm(`Supprimer ${selectedIds.size} alerte(s) ?`)) return;
    await supabase.from('alerts').delete().in('id', [...selectedIds]);
    setSelectedIds(new Set());
    refetch?.();
  }, [selectedIds, refetch]);

  // ── Status toggle ──
  const handleToggleStatus = useCallback(async (e: React.MouseEvent, alert: AlertData) => {
    e.stopPropagation();
    const newStatus = alert.status === 'EN COURS' ? 'RESOLUE' : 'EN COURS';
    setTogglingId(alert.id);
    await supabase.from('alerts').update({ status: newStatus }).eq('id', alert.id);
    setTogglingId(null);
    refetch?.();
    if (panelAlert?.id === alert.id) setPanelAlert({ ...panelAlert, status: newStatus });
  }, [panelAlert, refetch]);

  // ── Sort toggle ──
  const handleSort = (field: typeof sortField) => {
    if (sortField === field) setSortAsc(a => !a);
    else { setSortField(field); setSortAsc(true); }
  };

  // ── Selection ──
  const toggleSelect = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map(a => a.id)));
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin w-10 h-10 border-4 border-safe-red border-t-transparent rounded-full" />
          <p className="text-gray-400 text-sm">Chargement des alertes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-6 h-full relative">
      {/* ── Main Panel ── */}
      <div className={`flex-1 flex flex-col gap-4 min-w-0 transition-all duration-300 ${panelAlert ? 'lg:mr-96' : ''}`}>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'En cours', value: enCours, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', dot: 'bg-red-500 animate-pulse' },
            { label: 'Résolues', value: resolues, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20', dot: 'bg-green-500' },
            { label: 'Critiques', value: critiques, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20', dot: 'bg-orange-500' },
          ].map(c => (
            <div key={c.label} className={`${c.bg} border rounded-2xl p-4 flex flex-col gap-1`}>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                <span className="text-xs text-gray-400 font-medium">{c.label}</span>
              </div>
              <span className={`text-3xl font-black ${c.color}`}>{c.value}</span>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="bg-safe-card border border-safe-border rounded-2xl p-3 flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher par nom, lieu..."
              className="w-full bg-safe-dark border border-safe-border rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-safe-red transition-colors"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                <X size={13} />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="flex rounded-xl overflow-hidden border border-safe-border bg-safe-dark">
            {(['ALL', 'EN COURS', 'RESOLUE'] as const).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-2 text-xs font-semibold transition-colors ${statusFilter === s ? 'bg-safe-red text-white' : 'text-gray-400 hover:text-white'}`}
              >
                {s === 'ALL' ? 'Tous' : s === 'EN COURS' ? 'En cours' : 'Résolues'}
              </button>
            ))}
          </div>

          {/* Danger Filter */}
          <select
            value={dangerFilter}
            onChange={e => setDangerFilter(e.target.value)}
            className="bg-safe-dark border border-safe-border text-sm text-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:border-safe-red cursor-pointer"
          >
            <option value="ALL">Tous niveaux</option>
            <option value="CRITIQUE">CRITIQUE</option>
            <option value="ÉLEVÉ">ÉLEVÉ</option>
            <option value="MOYEN">MOYEN</option>
            <option value="FAIBLE">FAIBLE</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="bg-safe-dark border border-safe-border text-sm text-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:border-safe-red cursor-pointer"
          >
            <option value="ALL">Tous types</option>
            <option value="missing_person">Disparition</option>
            <option value="child_abduction">Enlèvement</option>
          </select>

          {/* Actions */}
          <div className="flex items-center gap-2 ml-auto">
            <button onClick={() => refetch?.()} title="Rafraîchir" className="p-2 rounded-xl bg-safe-dark border border-safe-border text-gray-400 hover:text-white hover:border-gray-500 transition-colors">
              <RefreshCw size={15} />
            </button>
            <button onClick={() => navigate('/admin/new-alert')} className="flex items-center gap-2 bg-safe-red hover:bg-red-500 transition-colors text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg shadow-safe-red/20">
              <Plus size={14} />
              Nouvelle alerte
            </button>
          </div>
        </div>

        {/* Bulk action bar */}
        {selectedIds.size > 0 && (
          <div className="bg-red-600/10 border border-red-500/30 rounded-2xl px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-red-400 font-semibold">{selectedIds.size} alerte(s) sélectionnée(s)</span>
            <div className="flex gap-2">
              <button onClick={() => setSelectedIds(new Set())} className="text-xs text-gray-400 hover:text-white px-3 py-1.5 rounded-lg border border-safe-border transition-colors">Annuler</button>
              <button onClick={handleBulkDelete} className="text-xs text-white bg-red-600 hover:bg-red-500 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors">
                <Trash2 size={12} /> Supprimer la sélection
              </button>
            </div>
          </div>
        )}

        {/* Table header */}
        {filtered.length > 0 && (
          <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-3 px-4 py-2 text-[10px] text-gray-500 uppercase tracking-widest font-bold items-center">
            <button onClick={toggleSelectAll} className="text-gray-500 hover:text-white transition-colors">
              {selectedIds.size === filtered.length && filtered.length > 0 ? <CheckSquare size={15} className="text-safe-red" /> : <Square size={15} />}
            </button>
            <button onClick={() => handleSort('name')} className="flex items-center gap-1 hover:text-gray-300 transition-colors text-left">
              Nom / Lieu <ArrowUpDown size={10} className={sortField === 'name' ? 'text-safe-red' : ''} />
            </button>
            <button onClick={() => handleSort('dangerLevel')} className="flex items-center gap-1 hover:text-gray-300 transition-colors">
              Danger <ArrowUpDown size={10} className={sortField === 'dangerLevel' ? 'text-safe-red' : ''} />
            </button>
            <span>Statut</span>
            <button onClick={() => handleSort('created_at')} className="flex items-center gap-1 hover:text-gray-300 transition-colors">
              Date <ArrowUpDown size={10} className={sortField === 'created_at' ? 'text-safe-red' : ''} />
            </button>
            <span>Actions</span>
          </div>
        )}

        {/* Alert rows */}
        <div className="space-y-2 overflow-y-auto flex-1">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-500 flex flex-col items-center gap-3">
              <UserX size={40} className="text-gray-700" />
              <p className="text-sm">Aucune alerte trouvée</p>
              {(search || statusFilter !== 'ALL' || dangerFilter !== 'ALL') && (
                <button onClick={() => { setSearch(''); setStatusFilter('ALL'); setDangerFilter('ALL'); setTypeFilter('ALL'); }} className="text-xs text-safe-red hover:underline">
                  Réinitialiser les filtres
                </button>
              )}
            </div>
          ) : filtered.map(alert => {
            const isSelected = selectedIds.has(alert.id);
            const isDeleting = deletingIds.has(alert.id);
            const isToggling = togglingId === alert.id;
            const isActive = panelAlert?.id === alert.id;
            const dangerKey = (alert.dangerLevel || 'MOYEN').toUpperCase();
            const danger = DANGER_CONFIG[dangerKey] ?? DANGER_CONFIG['MOYEN'];

            return (
              <div
                key={alert.id}
                onClick={() => setPanelAlert(isActive ? null : alert)}
                className={`grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-3 items-center px-4 py-3 rounded-2xl border cursor-pointer transition-all duration-200 group ${
                  isActive
                    ? 'bg-safe-red/5 border-safe-red/40'
                    : isSelected
                    ? 'bg-white/5 border-white/20'
                    : 'bg-safe-card border-safe-border hover:border-safe-red/40 hover:bg-safe-red/3'
                } ${isDeleting ? 'opacity-40 pointer-events-none' : ''}`}
              >
                {/* Checkbox */}
                <button onClick={e => toggleSelect(e, alert.id)} className="text-gray-500 hover:text-white transition-colors shrink-0">
                  {isSelected ? <CheckSquare size={15} className="text-safe-red" /> : <Square size={15} />}
                </button>

                {/* Identity */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <img src={alert.photoUrl} alt={alert.name} className="w-11 h-11 rounded-xl object-cover border border-safe-border" />
                    <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-safe-card ${alert.status === 'EN COURS' ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-white truncate">{alert.name}</p>
                    <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                      <MapPin size={10} className="shrink-0" />
                      {alert.location}
                    </p>
                    <p className="text-[10px] text-gray-600 mt-0.5">
                      {alert.type === 'child_abduction' ? '🔴 Enlèvement' : '🟡 Disparition'} · {alert.age} ans
                    </p>
                  </div>
                </div>

                {/* Danger */}
                <DangerBadge level={alert.dangerLevel} />

                {/* Status toggle */}
                <button
                  onClick={e => handleToggleStatus(e, alert)}
                  disabled={isToggling}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                    alert.status === 'EN COURS'
                      ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
                      : 'bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20'
                  }`}
                  title="Changer le statut"
                >
                  {isToggling
                    ? <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    : alert.status === 'EN COURS'
                    ? <Radio size={12} />
                    : <CheckCircle2 size={12} />
                  }
                  {alert.status === 'EN COURS' ? 'En cours' : 'Résolue'}
                </button>

                {/* Date */}
                <div className="text-right hidden xl:block">
                  <p className="text-xs text-gray-400">{new Date(alert.created_at).toLocaleDateString('fr-FR')}</p>
                  <p className="text-[10px] text-gray-600">{new Date(alert.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={e => { e.stopPropagation(); navigate(`/admin/edit-alert/${alert.id}`); }}
                    className="p-2 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
                    title="Modifier"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={e => handleDelete(e, alert.id)}
                    className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer count */}
        {filtered.length > 0 && (
          <p className="text-xs text-gray-600 text-center pb-2">
            {filtered.length} alerte{filtered.length > 1 ? 's' : ''} affichée{filtered.length > 1 ? 's' : ''} sur {alerts.length} au total
          </p>
        )}
      </div>

      {/* ── Slide-in Detail Panel ── */}
      {panelAlert && (
        <div className="hidden lg:flex lg:w-96 shrink-0 flex-col bg-safe-card border border-safe-border rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-right duration-200 h-[calc(100vh-12rem)] sticky top-0">
          {/* Panel header */}
          <div className="flex justify-between items-center p-4 border-b border-safe-border shrink-0">
            <span className="text-sm font-bold text-white">Détail de l'alerte</span>
            <button onClick={() => setPanelAlert(null)} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors">
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Photo + Identity */}
            <div className="relative rounded-2xl overflow-hidden h-36 bg-safe-dark border border-safe-border">
              <img src={panelAlert.photoUrl} alt={panelAlert.name} className="w-full h-full object-cover opacity-60" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3">
                <h3 className="font-black text-xl text-white leading-tight">{panelAlert.name}</h3>
                <p className="text-xs text-gray-300">{panelAlert.type === 'child_abduction' ? '🔴 Enlèvement' : '🟡 Disparition'} · {panelAlert.age} ans</p>
              </div>
              <div className="absolute top-3 right-3">
                <DangerBadge level={panelAlert.dangerLevel} />
              </div>
            </div>

            {/* Status */}
            <div className={`flex items-center justify-between p-3 rounded-xl border ${panelAlert.status === 'EN COURS' ? 'bg-red-500/10 border-red-500/20' : 'bg-green-500/10 border-green-500/20'}`}>
              <span className="text-xs font-semibold text-gray-400">Statut actuel</span>
              <span className={`text-sm font-black ${panelAlert.status === 'EN COURS' ? 'text-red-400' : 'text-green-400'}`}>{panelAlert.status}</span>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: Calendar, label: 'Vu le', value: new Date(panelAlert.lastSeen || panelAlert.created_at).toLocaleDateString('fr-FR') },
                { icon: MapPin, label: 'Lieu', value: panelAlert.location },
                { icon: Eye, label: 'Yeux', value: panelAlert.eyeColor },
                { icon: FileText, label: 'Cheveux', value: panelAlert.hairColor },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="bg-safe-dark border border-safe-border rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon size={11} className="text-gray-500" />
                    <span className="text-[10px] text-gray-500 uppercase font-bold">{label}</span>
                  </div>
                  <p className="text-xs text-white font-semibold truncate">{value || 'N/A'}</p>
                </div>
              ))}
            </div>

            {/* Vehicle */}
            {panelAlert.suspectVehicle && panelAlert.suspectVehicle !== 'Aucun' && (
              <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Car size={12} className="text-orange-400" />
                  <span className="text-[10px] text-orange-400 uppercase font-bold">Véhicule suspect</span>
                </div>
                <p className="text-sm text-white font-semibold">{panelAlert.suspectVehicle}</p>
              </div>
            )}

            {/* Description */}
            {panelAlert.description && (
              <div className="bg-safe-dark border border-safe-border rounded-xl p-3">
                <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Description</p>
                <p className="text-xs text-gray-300 leading-relaxed">{panelAlert.description}</p>
              </div>
            )}

            {/* GPS coords */}
            <div className="bg-safe-dark border border-safe-border rounded-xl p-3 font-mono">
              <div className="flex items-center gap-1.5 mb-1">
                <Crosshair size={11} className="text-gray-500" />
                <span className="text-[10px] text-gray-500 uppercase font-bold">Coordonnées GPS</span>
              </div>
              <p className="text-xs text-green-400">{panelAlert.coordinates.lat.toFixed(6)}, {panelAlert.coordinates.lng.toFixed(6)}</p>
              <a
                href={`https://maps.google.com/?q=${panelAlert.coordinates.lat},${panelAlert.coordinates.lng}`}
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-blue-400 hover:underline mt-1 inline-block"
              >
                Ouvrir dans Google Maps →
              </a>
            </div>
          </div>

          {/* Panel footer actions */}
          <div className="p-4 border-t border-safe-border space-y-2 shrink-0">
            <button
              onClick={() => navigate(`/alert/${panelAlert.id}`)}
              className="w-full flex items-center justify-center gap-2 bg-safe-red hover:bg-red-500 text-white text-sm font-bold py-2.5 rounded-xl transition-colors"
            >
              <Eye size={15} /> Voir la fiche complète
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => navigate(`/admin/edit-alert/${panelAlert.id}`)}
                className="flex items-center justify-center gap-1.5 text-xs font-semibold text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 py-2 rounded-xl transition-colors"
              >
                <Edit2 size={13} /> Modifier
              </button>
              <button
                onClick={e => handleToggleStatus(e as any, panelAlert)}
                disabled={togglingId === panelAlert.id}
                className={`flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-xl border transition-colors ${
                  panelAlert.status === 'EN COURS'
                    ? 'text-green-400 bg-green-500/10 hover:bg-green-500/20 border-green-500/20'
                    : 'text-red-400 bg-red-500/10 hover:bg-red-500/20 border-red-500/20'
                }`}
              >
                {panelAlert.status === 'EN COURS' ? <><CheckCircle2 size={13} /> Résoudre</> : <><Radio size={13} /> Rouvrir</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminReportsView() {
  const [reports, setReports] = useState<any[]>([]);
  useEffect(() => {
    supabase.from('reports').select('*, profiles:user_id(name), alerts:alert_id(victim_name)').order('created_at', { ascending: false }).then(({data}) => {
      if (data) {
        const mapped = data.map(r => {
          const mediaUrls = [...(r.description || '').matchAll(/https:\/\/[^\s]+/g)].map(m => m[0]);
          const cleanDescription = r.description ? r.description.replace(/Medias?:[\s\S]*?(?=https:\/\/|$)/, '').replace(/(https:\/\/[^\s]+\s*)+/, '').trim() : '';
          return { ...r, media_urls: mediaUrls, clean_description: cleanDescription };
        });
        setReports(mapped);
      }
    });
  }, []);

  return (
    <div className="bg-safe-card border border-safe-border rounded-3xl p-6 overflow-y-auto">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><MessageSquare className="text-blue-500" /> Flux des Signalements</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {reports.map(report => (
          <div key={report.id} className="bg-safe-dark border border-safe-border rounded-2xl p-5 flex flex-col gap-4 hover:border-blue-500/50 transition-colors">
             <div className="flex justify-between items-start border-b border-safe-border pb-3">
               <div>
                  <div className="flex gap-2 items-center mb-1">
                    <span className="text-xs font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded uppercase flex items-center gap-1"><Activity size={12} /> {report.report_type}</span>
                    {report.alerts && (
                       <Link to={`/alert/${report.alert_id}`} className="text-xs font-bold text-safe-red bg-safe-red/10 px-2 py-0.5 rounded uppercase hover:bg-safe-red/20 transition-colors">
                         Alerte: {report.alerts.victim_name}
                       </Link>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 flex items-center gap-1"><Clock size={12} /> {new Date(report.created_at).toLocaleString()}</p>
               </div>
               <div className="flex items-center gap-2">
                 <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center font-bold text-xs uppercase">
                   {(report.profiles?.name || 'A').charAt(0)}
                 </div>
                 <span className="text-sm font-bold text-white">{report.profiles?.name || 'Anonyme'}</span>
               </div>
             </div>
             
             {report.media_urls && report.media_urls.length > 0 && (
               <div className={`grid gap-2 ${report.media_urls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                 {report.media_urls.map((url: string, i: number) => (
                    <img key={i} src={url} alt={`Media ${i}`} className="w-full h-40 object-cover rounded-xl border border-safe-border" />
                 ))}
               </div>
             )}
             
             {report.clean_description && (
               <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                 <p className="text-sm text-white whitespace-pre-wrap leading-relaxed">{report.clean_description}</p>
               </div>
             )}

             <div className="flex flex-wrap gap-2 mt-auto pt-2">
               {report.location && (
                 <div className="text-xs text-gray-300 font-mono bg-safe-card border border-safe-border px-3 py-1.5 rounded-lg flex items-center gap-2">
                   <MapIcon size={12} className="text-gray-500" />
                   {report.location}
                 </div>
               )}
               {report.latitude && report.longitude && (
                 <a href={`https://maps.google.com/?q=${report.latitude},${report.longitude}`} target="_blank" rel="noreferrer" className="text-xs text-blue-400 font-mono bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-lg hover:bg-blue-500/20 transition-colors flex items-center gap-2">
                   <MapPin size={12} />
                   Voir sur la carte
                 </a>
               )}
             </div>
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

