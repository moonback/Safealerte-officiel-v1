import React, { useState, useEffect } from 'react';
import { Filter, ChevronUp, MapPin, Eye, ShieldAlert, Users } from 'lucide-react';
import { useAlerts } from '../hooks/useAlerts';
import { supabase } from '../lib/supabase';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

const customAlertIcon = new L.DivIcon({
  html: `<div class="relative flex h-8 w-8">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-safe-red opacity-75"></span>
          <span class="relative flex items-center justify-center rounded-full h-8 w-8 bg-safe-red border-2 border-white shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-white"><path d="m12 14-8-8 8-8 8 8Z"/><path d="M12 14v4"/><path d="M12 22v-4"/><path d="M8 22h8"/></svg>
          </span>
        </div>`,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const customReportIcon = new L.DivIcon({
  html: `<div class="relative flex items-center justify-center rounded-full h-6 w-6 bg-blue-500 border-2 border-white shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-white"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
          </div>`,
  className: '',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const customTeamIcon = new L.DivIcon({
  html: `<div class="relative flex items-center justify-center rounded-full h-6 w-6 bg-green-500 border-2 border-white shadow-lg">
            <span class="w-2 h-2 bg-white rounded-full"></span>
          </div>`,
  className: '',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

export default function MapScreen() {
  const [activeFilter, setActiveFilter] = useState('Toutes');
  const [sheetOpen, setSheetOpen] = useState(true);
  const { alerts } = useAlerts();
  const [reports, setReports] = useState<any[]>([]);

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

  const filters = ['Toutes', 'Alertes', 'Signalements'];

  return (
    <div className="relative min-h-[500px] h-full flex flex-col z-0">
      {/* Search & Filters Overlay */}
      <div className="absolute top-0 left-0 w-full z-20 px-4 py-4 md:py-8 pointer-events-none">
        <div className="flex gap-2 overflow-x-auto pb-2 pointer-events-auto hide-scrollbar">
          {filters.map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeFilter === f 
                  ? 'bg-safe-red text-white border-safe-red' 
                  : 'bg-safe-card text-gray-300 border-safe-border text-xs md:text-sm'
              } border shadow-lg`}
            >
              {f}
            </button>
          ))}
          <button className="px-3 py-2 rounded-full bg-safe-card border border-safe-border text-white pointer-events-auto shrink-0 shadow-lg hidden md:block">
            <Filter size={18} />
          </button>
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative bg-[#0a0a0a] overflow-hidden z-10 w-full h-full">
        <MapContainer 
          center={[46.603354, 1.888334] /* Center of France */} 
          zoom={6} 
          style={{ height: '100%', width: '100%', background: '#0a0a0a' }}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          
          {(activeFilter === 'Toutes' || activeFilter === 'Alertes') && alerts.map(alert => (
             <Marker 
               key={alert.id} 
               position={[alert.coordinates.lat, alert.coordinates.lng]}
               icon={customAlertIcon}
             >
               <Popup className="bg-safe-card border-safe-border text-white z-50">
                  <div className="p-2 w-48 bg-safe-card text-white rounded-lg border-safe-border">
                    <h3 className="font-bold text-sm mb-1">{alert.name}</h3>
                    <p className="text-xs text-gray-400 mb-2">{alert.location}</p>
                    <img src={alert.photoUrl} alt="" className="w-full h-32 object-cover rounded-lg" />
                  </div>
               </Popup>
             </Marker>
          ))}

          {(activeFilter === 'Toutes' || activeFilter === 'Signalements') && reports.map(report => {
            let lat = report.latitude || (45.75 + (Math.random() * 0.1 - 0.05));
            let lng = report.longitude || (4.85 + (Math.random() * 0.1 - 0.05));
            
            return (
              <Marker 
                key={report.id} 
                position={[lat, lng]}
                icon={customReportIcon}
              >
                <Popup>
                  <div className="p-2 w-48">
                    <h3 className="font-bold text-xs text-blue-500 uppercase">{report.report_type}</h3>
                    <p className="text-xs font-bold my-1 text-black">{report.profiles?.name || 'Citoyen'} - {new Date(report.created_at).toLocaleTimeString()}</p>
                    {report.media_url && <img src={report.media_url} alt="" className="w-full h-24 object-cover rounded mt-1" />}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Bottom Sheet for Nearby Alerts */}
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
            <h3 className="font-bold text-lg">À proximité ({alerts.length})</h3>
            <button className="p-1">
              <ChevronUp size={20} className={`text-gray-400 transition-transform ${sheetOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>

          <div className="space-y-3 max-h-64 overflow-y-auto pr-2 pb-4">
            {alerts.length === 0 ? (
              <p className="text-gray-500 text-sm py-4 text-center">Aucune alerte à proximité.</p>
            ) : alerts.map(alert => (
              <div key={alert.id} className="bg-safe-dark border border-safe-border rounded-xl p-3 flex gap-3 items-center">
                <img src={alert.photoUrl} alt={alert.name} className="w-14 h-14 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-sm truncate">{alert.name}</h4>
                    <span className="text-[10px] font-semibold bg-safe-red/20 text-safe-red px-2 py-0.5 rounded uppercase">
                      {alert.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 truncate mb-1">{alert.type === 'child_abduction' ? "Enlèvement" : "Disparition"}</p>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <MapPin size={12} />
                    <span>À consulter</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
