import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Filter, ChevronUp, MapPin, Eye, ShieldAlert, Users,
  Search, X, Navigation, Wifi, WifiOff, Radio,
  AlertTriangle, FileText, BarChart2, ZoomIn, ZoomOut,
  Crosshair, Layers, Clock, ChevronRight, LocateFixed
} from 'lucide-react';
import { useAlerts, AlertData } from '../hooks/useAlerts';
import { supabase } from '../lib/supabase';
import {
  MapContainer, TileLayer, Marker, Popup, Circle,
  useMap, useMapEvents
} from 'react-leaflet';
import L from 'leaflet';

// ─────────────────────────────────────────────
// Custom Icons
// ─────────────────────────────────────────────
const customAlertIcon = new L.DivIcon({
  html: `<div class="relative flex h-10 w-10">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-60"></span>
          <span class="relative flex items-center justify-center rounded-full h-10 w-10 bg-red-600 border-2 border-white shadow-xl">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </span>
        </div>`,
  className: '',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const customReportIcon = new L.DivIcon({
  html: `<div class="relative flex items-center justify-center rounded-full h-7 w-7 bg-blue-500 border-2 border-white shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          </div>`,
  className: '',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const userLocationIcon = new L.DivIcon({
  html: `<div class="relative flex h-5 w-5">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
          <span class="relative flex items-center justify-center rounded-full h-5 w-5 bg-blue-500 border-2 border-white shadow-lg"></span>
        </div>`,
  className: '',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const searchResultIcon = new L.DivIcon({
  html: `<div class="flex items-center justify-center h-8 w-8 bg-purple-600 rounded-full border-2 border-white shadow-xl">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="white" stroke-width="2.5" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
        </div>`,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

// ─────────────────────────────────────────────
// Helper: Fly to coords
// ─────────────────────────────────────────────
function FlyTo({ coords, zoom }: { coords: [number, number] | null; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    if (coords) map.flyTo(coords, zoom ?? 14, { duration: 1.2 });
  }, [coords, zoom, map]);
  return null;
}

// ─────────────────────────────────────────────
// Helper: Zoom buttons
// ─────────────────────────────────────────────
function ZoomControls() {
  const map = useMap();
  return (
    <div className="absolute bottom-72 right-3 z-40 flex flex-col gap-1">
      <button
        onClick={() => map.zoomIn()}
        className="w-10 h-10 bg-safe-card/90 backdrop-blur border border-safe-border rounded-xl flex items-center justify-center text-white shadow-lg hover:bg-safe-card transition-colors"
        title="Zoom avant"
      >
        <ZoomIn size={18} />
      </button>
      <button
        onClick={() => map.zoomOut()}
        className="w-10 h-10 bg-safe-card/90 backdrop-blur border border-safe-border rounded-xl flex items-center justify-center text-white shadow-lg hover:bg-safe-card transition-colors"
        title="Zoom arrière"
      >
        <ZoomOut size={18} />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
export default function MapScreen() {
  const [activeFilter, setActiveFilter] = useState('Toutes');
  const [sheetOpen, setSheetOpen] = useState(true);
  const { alerts, loading: alertsLoading } = useAlerts();
  const [reports, setReports] = useState<any[]>([]);

  // ── Feature 1: Address Search ──
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<{ lat: number; lng: number; label: string } | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Feature 2: GPS Location ──
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);
  const [flyZoom, setFlyZoom] = useState<number>(14);

  // ── Feature 3: Realtime ──
  const [isLive, setIsLive] = useState(true);
  const [newAlertCount, setNewAlertCount] = useState(0);
  const [realtimeAlerts, setRealtimeAlerts] = useState<AlertData[]>([]);

  // ── Feature 4: Stats HUD ──
  const [showStats, setShowStats] = useState(false);

  // ── Feature 5: Alert Detail Panel ──
  const [selectedAlert, setSelectedAlert] = useState<AlertData | null>(null);

  // ─── Fetch reports ───
  useEffect(() => {
    const fetchReports = async () => {
      const { data } = await supabase.from('reports').select('*, profiles:user_id(name)');
      if (data) {
        const mapped = data.map(r => {
          const mediaMatch = r.description?.match(/Media: (https:\/\/[^\s]+)/);
          const mediaUrl = mediaMatch ? mediaMatch[1].trim() : null;
          return { ...r, media_url: mediaUrl };
        });
        setReports(mapped);
      }
    };
    fetchReports();
  }, []);

  // ─── Sync realtimeAlerts from alerts ───
  useEffect(() => {
    setRealtimeAlerts(alerts);
  }, [alerts]);

  // ─── Feature 3: Supabase Realtime subscription ───
  useEffect(() => {
    if (!isLive) return;
    const channel = supabase
      .channel('live-alerts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'alerts' }, (payload) => {
        const d = payload.new as any;
        const photoMatch = d.description?.match(/Photo:\s*(https:\/\/[^\s]+)/);
        const photoUrl = photoMatch ? photoMatch[1].trim() : 'https://i.pravatar.cc/300?img=43';
        const newAlert: AlertData = {
          id: d.id,
          type: d.type || 'missing_person',
          name: d.victim_name || 'Inconnu',
          age: d.age || 0,
          height: d.height || 'Non précisé',
          eyeColor: 'Non précisé',
          hairColor: 'Non précisé',
          lastSeen: d.missing_since || d.created_at,
          location: d.location || 'Localisation inconnue',
          description: d.description || '',
          suspectVehicle: d.suspect_vehicle || '',
          dangerLevel: d.danger_level || 'MOYEN',
          status: d.status || 'EN COURS',
          coordinates: { lat: d.latitude || 45.75, lng: d.longitude || 4.85 },
          photoUrl,
          created_at: d.created_at,
        };
        setRealtimeAlerts(prev => [newAlert, ...prev]);
        setNewAlertCount(n => n + 1);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isLive]);

  // ─── Feature 1: Address search debounce ───
  useEffect(() => {
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    if (searchQuery.trim().length < 3) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    setSearchLoading(true);
    searchDebounce.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&accept-language=fr`,
          { headers: { 'User-Agent': 'SafeAlerteApp/1.0' } }
        );
        const data = await res.json();
        setSearchSuggestions(data);
        setShowSuggestions(true);
      } catch {
        setSearchSuggestions([]);
      } finally {
        setSearchLoading(false);
      }
    }, 400);
  }, [searchQuery]);

  const handleSelectSuggestion = useCallback((s: any) => {
    const lat = parseFloat(s.lat);
    const lng = parseFloat(s.lon);
    setSearchResult({ lat, lng, label: s.display_name });
    setSearchQuery(s.display_name.split(',')[0]);
    setShowSuggestions(false);
    setFlyTarget([lat, lng]);
    setFlyZoom(15);
  }, []);

  // ─── Feature 2: GPS ───
  const handleLocate = useCallback(() => {
    if (!navigator.geolocation) { setGpsError("GPS non supporté"); return; }
    setGpsLoading(true);
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        setFlyTarget([loc.lat, loc.lng]);
        setFlyZoom(16);
        setGpsLoading(false);
      },
      (err) => {
        setGpsError("Impossible d'obtenir votre position");
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const filters = ['Toutes', 'Alertes', 'Signalements'];

  const displayedAlerts = realtimeAlerts;

  // Stats
  const activeAlertsCount = displayedAlerts.filter(a => a.status === 'EN COURS').length;
  const reportsCount = reports.length;

  return (
    <div className="relative min-h-[500px] h-full flex flex-col z-0" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* ─────── TOP OVERLAY ─────── */}
      <div className="absolute top-0 left-0 w-full z-20 px-3 pt-3 pointer-events-none">
        
        {/* ── Feature 1: Search Bar ── */}
        <div className="pointer-events-auto mb-2 relative">
          <div className="flex items-center gap-2 bg-safe-card/95 backdrop-blur-md border border-safe-border rounded-2xl px-3 py-2 shadow-xl">
            {searchLoading
              ? <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin shrink-0" />
              : <Search size={16} className="text-gray-400 shrink-0" />
            }
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => searchSuggestions.length > 0 && setShowSuggestions(true)}
              placeholder="Rechercher une adresse ou un lieu..."
              className="flex-1 bg-transparent text-white text-sm outline-none placeholder-gray-500"
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(''); setSearchResult(null); setShowSuggestions(false); }}>
                <X size={16} className="text-gray-400 hover:text-white transition-colors" />
              </button>
            )}
          </div>

          {/* Suggestions dropdown */}
          {showSuggestions && searchSuggestions.length > 0 && (
            <div className="absolute top-full mt-1 left-0 right-0 bg-safe-card border border-safe-border rounded-xl shadow-2xl overflow-hidden z-50">
              {searchSuggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSelectSuggestion(s)}
                  className="w-full text-left px-3 py-2.5 text-sm hover:bg-white/5 transition-colors border-b border-safe-border/50 last:border-0 flex gap-2 items-start"
                >
                  <MapPin size={13} className="text-purple-400 mt-0.5 shrink-0" />
                  <span className="text-gray-200 leading-tight line-clamp-1">{s.display_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Filters Row ── */}
        <div className="flex gap-2 overflow-x-auto pb-1 pointer-events-auto hide-scrollbar">
          {filters.map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 border shadow-lg ${
                activeFilter === f
                  ? 'bg-red-600 text-white border-red-500 scale-105'
                  : 'bg-safe-card/90 backdrop-blur text-gray-300 border-safe-border hover:border-gray-500'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* ─────── RIGHT SIDE CONTROLS ─────── */}
      <div className="absolute top-24 right-3 z-30 flex flex-col gap-2">
        
        {/* Feature 2: GPS Locate button */}
        <button
          onClick={handleLocate}
          disabled={gpsLoading}
          title="Ma position"
          className={`w-10 h-10 rounded-xl border shadow-lg flex items-center justify-center transition-all duration-200 ${
            gpsLoading
              ? 'bg-blue-500/20 border-blue-500 text-blue-400 animate-pulse'
              : userLocation
              ? 'bg-blue-500 border-blue-400 text-white'
              : 'bg-safe-card/90 backdrop-blur border-safe-border text-gray-300 hover:border-blue-400 hover:text-blue-400'
          }`}
        >
          {gpsLoading
            ? <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            : <LocateFixed size={17} />
          }
        </button>

        {/* Feature 3: Live toggle */}
        <button
          onClick={() => { setIsLive(l => !l); setNewAlertCount(0); }}
          title={isLive ? 'Désactiver le live' : 'Activer le live'}
          className={`w-10 h-10 rounded-xl border shadow-lg flex items-center justify-center transition-all duration-200 relative ${
            isLive
              ? 'bg-green-500/20 border-green-500 text-green-400'
              : 'bg-safe-card/90 backdrop-blur border-safe-border text-gray-500'
          }`}
        >
          <Radio size={17} />
          {isLive && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-400 rounded-full animate-ping" />
          )}
          {newAlertCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
              {newAlertCount}
            </span>
          )}
        </button>

        {/* Feature 4: Stats toggle */}
        <button
          onClick={() => setShowStats(s => !s)}
          title="Statistiques"
          className={`w-10 h-10 rounded-xl border shadow-lg flex items-center justify-center transition-all duration-200 ${
            showStats
              ? 'bg-purple-500/20 border-purple-500 text-purple-400'
              : 'bg-safe-card/90 backdrop-blur border-safe-border text-gray-300 hover:border-purple-400 hover:text-purple-400'
          }`}
        >
          <BarChart2 size={17} />
        </button>
      </div>

      {/* ─────── Feature 4: STATS HUD ─────── */}
      {showStats && (
        <div className="absolute top-24 left-3 z-30 bg-safe-card/95 backdrop-blur border border-safe-border rounded-2xl shadow-2xl p-3 w-48 pointer-events-auto">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Vue d'ensemble</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs text-gray-300">Alertes actives</span>
              </div>
              <span className="text-sm font-bold text-red-400">{activeAlertsCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-xs text-gray-300">Signalements</span>
              </div>
              <span className="text-sm font-bold text-blue-400">{reportsCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-xs text-gray-300">Mode</span>
              </div>
              <span className={`text-xs font-bold ${isLive ? 'text-green-400' : 'text-gray-500'}`}>
                {isLive ? 'LIVE' : 'STATIQUE'}
              </span>
            </div>
            <div className="border-t border-safe-border pt-2 mt-2">
              <div className="flex items-center gap-1 text-[10px] text-gray-500">
                <Clock size={10} />
                <span>MàJ: {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GPS error toast */}
      {gpsError && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-red-600/90 backdrop-blur text-white text-xs px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
          <AlertTriangle size={12} />
          {gpsError}
          <button onClick={() => setGpsError(null)}><X size={12} /></button>
        </div>
      )}

      {/* ─────── MAP ─────── */}
      <div className="flex-1 relative bg-[#0a0a0a] overflow-hidden z-10 w-full h-full">
        <MapContainer
          center={[46.603354, 1.888334]}
          zoom={6}
          style={{ height: '100%', width: '100%', background: '#0a0a0a' }}
          zoomControl={false}
        >
          {/* Satellite TileLayer */}
          <TileLayer
            attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />

          {/* Fly-to controller */}
          <FlyTo coords={flyTarget} zoom={flyZoom} />

          {/* Feature 2: User location marker + accuracy ring */}
          {userLocation && (
            <>
              <Circle
                center={[userLocation.lat, userLocation.lng]}
                radius={120}
                pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.1, weight: 1 }}
              />
              <Marker
                position={[userLocation.lat, userLocation.lng]}
                icon={userLocationIcon}
              >
                <Popup>
                  <div className="p-1 text-xs text-black font-semibold">📍 Votre position</div>
                </Popup>
              </Marker>
            </>
          )}

          {/* Feature 1: Search result pin */}
          {searchResult && (
            <Marker
              position={[searchResult.lat, searchResult.lng]}
              icon={searchResultIcon}
            >
              <Popup>
                <div className="p-2 w-48">
                  <p className="text-xs font-semibold text-purple-600">📍 Résultat de recherche</p>
                  <p className="text-xs text-gray-700 mt-1 leading-snug">{searchResult.label}</p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Alert markers */}
          {(activeFilter === 'Toutes' || activeFilter === 'Alertes') && displayedAlerts.map(alert => (
            <Marker
              key={alert.id}
              position={[alert.coordinates.lat, alert.coordinates.lng]}
              icon={customAlertIcon}
              eventHandlers={{ click: () => { setSelectedAlert(alert); setSheetOpen(false); } }}
            >
              <Popup className="bg-safe-card border-safe-border text-white z-50">
                <div className="p-2 w-52 bg-gray-900 text-white rounded-lg">
                  <div className="flex gap-2 items-start mb-2">
                    <img src={alert.photoUrl} alt={alert.name} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                    <div>
                      <h3 className="font-bold text-sm">{alert.name}</h3>
                      <p className="text-xs text-gray-400">{alert.location}</p>
                      <span className="text-[10px] font-semibold bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded mt-1 inline-block">
                        {alert.status}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => { setSelectedAlert(alert); setSheetOpen(false); }}
                    className="w-full bg-red-600 text-white text-xs font-semibold py-1.5 rounded-lg hover:bg-red-500 transition-colors"
                  >
                    Voir le détail
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Report markers */}
          {(activeFilter === 'Toutes' || activeFilter === 'Signalements') && reports.map(report => {
            const lat = report.latitude || 45.75 + (Math.random() * 0.1 - 0.05);
            const lng = report.longitude || 4.85 + (Math.random() * 0.1 - 0.05);
            return (
              <Marker key={report.id} position={[lat, lng]} icon={customReportIcon}>
                <Popup>
                  <div className="p-2 w-48">
                    <h3 className="font-bold text-xs text-blue-600 uppercase">{report.report_type}</h3>
                    <p className="text-xs font-bold my-1 text-black">
                      {report.profiles?.name || 'Citoyen'} — {new Date(report.created_at).toLocaleTimeString('fr-FR')}
                    </p>
                    {report.media_url && (
                      <img src={report.media_url} alt="" className="w-full h-24 object-cover rounded mt-1" />
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Zoom controls inside MapContainer */}
          <ZoomControlsPortal />
        </MapContainer>
      </div>

      {/* ─────── Feature 5: ALERT DETAIL PANEL ─────── */}
      {selectedAlert && (
        <div className="absolute inset-0 z-40 flex items-end pointer-events-none">
          <div className="w-full bg-safe-card/98 backdrop-blur-xl border-t border-safe-border rounded-t-3xl shadow-2xl pointer-events-auto p-5 pb-28 lg:pb-6 max-h-[75vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <img
                  src={selectedAlert.photoUrl}
                  alt={selectedAlert.name}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-safe-border shadow-lg"
                />
                <div>
                  <h2 className="font-bold text-lg leading-tight">{selectedAlert.name}</h2>
                  <p className="text-xs text-gray-400">{selectedAlert.type === 'child_abduction' ? 'Enlèvement' : 'Personne disparue'}</p>
                  <div className="flex gap-2 mt-1">
                    <span className="text-[10px] font-bold bg-red-600/20 text-red-400 px-2 py-0.5 rounded-full">{selectedAlert.status}</span>
                    <span className="text-[10px] font-bold bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full">⚠ {selectedAlert.dangerLevel}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => { setSelectedAlert(null); setSheetOpen(true); }}
                className="p-2 rounded-xl bg-safe-dark border border-safe-border text-gray-400 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {[
                { label: 'Âge', value: `${selectedAlert.age} ans` },
                { label: 'Taille', value: selectedAlert.height },
                { label: 'Yeux', value: selectedAlert.eyeColor },
                { label: 'Cheveux', value: selectedAlert.hairColor },
              ].filter(d => d.value && d.value !== 'Non précisé').map(({ label, value }) => (
                <div key={label} className="bg-safe-dark border border-safe-border rounded-xl p-2.5">
                  <p className="text-[10px] text-gray-500 uppercase font-semibold">{label}</p>
                  <p className="text-sm font-semibold text-white mt-0.5">{value}</p>
                </div>
              ))}
            </div>

            {/* Location */}
            <div className="bg-safe-dark border border-safe-border rounded-xl p-3 mb-3 flex items-start gap-2">
              <MapPin size={14} className="text-red-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] text-gray-500 uppercase font-semibold">Dernière position</p>
                <p className="text-sm text-white">{selectedAlert.location}</p>
                <p className="text-[11px] text-gray-500 font-mono mt-0.5">
                  {selectedAlert.coordinates.lat.toFixed(5)}, {selectedAlert.coordinates.lng.toFixed(5)}
                </p>
              </div>
            </div>

            {/* Vehicle */}
            {selectedAlert.suspectVehicle && (
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-3 mb-3 flex items-start gap-2">
                <AlertTriangle size={14} className="text-orange-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] text-orange-400 uppercase font-semibold">Véhicule suspect</p>
                  <p className="text-sm text-white">{selectedAlert.suspectVehicle}</p>
                </div>
              </div>
            )}

            {/* Centrer on map button */}
            <button
              onClick={() => {
                setFlyTarget([selectedAlert.coordinates.lat, selectedAlert.coordinates.lng]);
                setFlyZoom(16);
              }}
              className="w-full bg-red-600 hover:bg-red-500 text-white text-sm font-semibold py-3 rounded-2xl transition-colors flex items-center justify-center gap-2"
            >
              <Crosshair size={16} />
              Centrer sur la carte
            </button>
          </div>
        </div>
      )}

      {/* ─────── BOTTOM SHEET ─────── */}
      {!selectedAlert && (
        <div
          className={`absolute bottom-0 w-full bg-safe-card/95 backdrop-blur rounded-t-3xl border-t border-safe-border transition-transform duration-300 z-30 pb-24 lg:pb-6 ${
            sheetOpen ? 'translate-y-0' : 'translate-y-[calc(100%-60px)]'
          }`}
        >
          <div
            className="flex justify-center p-3 cursor-pointer"
            onClick={() => setSheetOpen(!sheetOpen)}
          >
            <div className="w-12 h-1.5 bg-gray-600 rounded-full" />
          </div>

          <div className="px-5">
            <div className="flex justify-between items-center mb-4 cursor-pointer" onClick={() => setSheetOpen(!sheetOpen)}>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg">À proximité</h3>
                <span className="bg-red-600/20 text-red-400 text-xs font-bold px-2 py-0.5 rounded-full">
                  {displayedAlerts.length}
                </span>
                {isLive && (
                  <span className="flex items-center gap-1 text-[10px] text-green-400 font-semibold">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-ping" />
                    LIVE
                  </span>
                )}
              </div>
              <ChevronUp size={20} className={`text-gray-400 transition-transform ${sheetOpen ? 'rotate-180' : ''}`} />
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto pr-2 pb-4">
              {alertsLoading ? (
                <div className="flex justify-center py-6">
                  <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : displayedAlerts.length === 0 ? (
                <p className="text-gray-500 text-sm py-4 text-center">Aucune alerte à proximité.</p>
              ) : displayedAlerts.map(alert => (
                <button
                  key={alert.id}
                  onClick={() => { setSelectedAlert(alert); setSheetOpen(false); }}
                  className="w-full bg-safe-dark border border-safe-border rounded-xl p-3 flex gap-3 items-center hover:border-red-500/50 transition-colors text-left"
                >
                  <img src={alert.photoUrl} alt={alert.name} className="w-14 h-14 rounded-xl object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold text-sm truncate">{alert.name}</h4>
                      <span className="text-[10px] font-semibold bg-red-600/20 text-red-400 px-2 py-0.5 rounded-full uppercase ml-1 shrink-0">
                        {alert.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 truncate mb-1">
                      {alert.type === 'child_abduction' ? 'Enlèvement' : 'Disparition'}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <MapPin size={11} />
                      <span className="truncate">{alert.location}</span>
                    </div>
                  </div>
                  <ChevronRight size={15} className="text-gray-600 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Separate component to use useMap inside MapContainer
function ZoomControlsPortal() {
  const map = useMap();
  return (
    <>
      <div
        style={{
          position: 'absolute',
          bottom: '280px',
          right: '12px',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}
      >
        <button
          onClick={() => map.zoomIn()}
          style={{
            width: '40px', height: '40px',
            background: 'rgba(30,30,30,0.92)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            color: 'white',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', fontWeight: 'bold',
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
            backdropFilter: 'blur(8px)',
          }}
        >+</button>
        <button
          onClick={() => map.zoomOut()}
          style={{
            width: '40px', height: '40px',
            background: 'rgba(30,30,30,0.92)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            color: 'white',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', fontWeight: 'bold',
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
            backdropFilter: 'blur(8px)',
          }}
        >−</button>
      </div>
    </>
  );
}
