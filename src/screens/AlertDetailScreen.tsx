import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Share2, AlertTriangle, Car, Calendar, MapPin, Search, Eye, MessageSquare, ShieldAlert } from 'lucide-react';
import { useAlerts } from '../hooks/useAlerts';
import { supabase } from '../lib/supabase';

export default function AlertDetailScreen() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { alerts, loading } = useAlerts();
  const [reports, setReports] = useState<any[]>([]);
  
  const alert = useMemo(() => alerts.find(a => a.id === id) || (alerts.length > 0 ? alerts[0] : null), [alerts, id]);

  useEffect(() => {
    const fetchReports = async () => {
      if (!alert) return;
      const { data } = await supabase
        .from('reports')
        .select('*, profiles:user_id(name)')
        .eq('alert_id', alert.id)
        .order('created_at', { ascending: false });
        
      if (data) {
        const mapped = data.map(r => {
          const mediaMatch = r.description?.match(/Media: (https:\/\/[^\s]+)/);
          const mediaUrl = mediaMatch ? mediaMatch[1].trim() : null;
          const cleanDescription = r.description ? r.description.replace(/Media: https:\/\/[^\s]+/, '').trim() : '';
          return { ...r, media_url: mediaUrl, clean_description: cleanDescription };
        });
        setReports(mapped);
      }
    };
    fetchReports();
  }, [alert]);

  const parsedVehicle = useMemo(() => {
    if (!alert || !alert.suspectVehicle || alert.suspectVehicle === "Aucun") return null;
    const parts = alert.suspectVehicle.split(' ');
    const lastPart = parts[parts.length - 1];
    
    // Check if last part is a license plate (e.g. has hyphens or length > 5)
    const hasPlate = lastPart && (lastPart.includes('-') || lastPart.length > 5);
    const plate = hasPlate ? lastPart.toUpperCase() : null;
    const otherParts = hasPlate ? parts.slice(0, -1) : parts;
    
    // Parse color to add a separator
    const colors = ['Gris', 'Noir', 'Blanc', 'Bleu', 'Rouge', 'Vert', 'Jaune', 'Bordeaux', 'Beige', 'Argent', 'gris', 'noir', 'blanc', 'bleu', 'rouge', 'vert', 'jaune', 'bordeaux', 'beige', 'argent'];
    let brandModelColor = otherParts.join(' ');
    
    for (const c of colors) {
      const idx = brandModelColor.toLowerCase().lastIndexOf(c.toLowerCase());
      if (idx !== -1 && idx > 0 && brandModelColor[idx - 1] !== '-') {
        brandModelColor = brandModelColor.substring(0, idx).trim() + ' - ' + brandModelColor.substring(idx).trim();
        break;
      }
    }
    
    return {
      text: brandModelColor,
      plate: plate
    };
  }, [alert]);

  const formattedDate = useMemo(() => {
    if (!alert || !alert.lastSeen) return '';
    const dateObj = new Date(alert.lastSeen);
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} à ${hours}:${minutes}`;
  }, [alert]);

  const eyesText = useMemo(() => {
    if (!alert || !alert.eyeColor) return 'Yeux non précisés';
    const text = alert.eyeColor.trim();
    if (text.toLowerCase().startsWith('yeux')) return text;
    return `Yeux ${text.toLowerCase()}`;
  }, [alert]);

  const hairText = useMemo(() => {
    if (!alert || !alert.hairColor) return 'Cheveux non précisés';
    const text = alert.hairColor.trim();
    if (text.toLowerCase().startsWith('cheveux')) return text;
    return `Cheveux ${text.toLowerCase()}`;
  }, [alert]);

  if (loading || !alert) {
     return <div className="min-h-screen bg-safe-dark flex justify-center items-center"><div className="animate-spin w-8 h-8 border-4 border-safe-red border-t-transparent rounded-full" /></div>
  }

  const alertTypeText = alert.type === 'child_abduction' ? "ENLÈVEMENT D'ENFANT" : "DISPARITION INQUIÉTANTE";

  return (
    <div className="bg-safe-dark min-h-screen text-white pb-28 font-sans">
      {/* Header bar */}
      <header className="flex justify-between items-center px-6 py-4 pt-12 bg-safe-dark border-b border-safe-border/50 sticky top-0 z-40 backdrop-blur-md bg-safe-dark/90">
        <button onClick={() => navigate(-1)} className="p-2 bg-safe-card border border-safe-border/50 rounded-full text-white hover:bg-safe-border transition-colors">
          <ArrowLeft size={20} />
        </button>
        <span className="font-bold text-base text-gray-200">Détail de l'alerte</span>
        <button className="p-2 bg-safe-card border border-safe-border/50 rounded-full text-white hover:bg-safe-border transition-colors">
          <Share2 size={20} />
        </button>
      </header>

      <div className="px-5 pt-6 space-y-6 max-w-lg mx-auto">
        {/* Alert Type Banner */}
        <div className="bg-gradient-to-r from-safe-red to-safe-red-hover p-4 rounded-2xl flex items-center gap-4 shadow-xl shadow-safe-red/10 border border-white/10">
          <div className="w-12 h-12 bg-black/20 rounded-xl flex items-center justify-center text-white shrink-0 border border-white/5">
            <ShieldAlert size={26} />
          </div>
          <div>
            <h2 className="font-black text-lg leading-tight tracking-wide">{alertTypeText}</h2>
            <p className="text-white/80 text-xs font-semibold mt-0.5 uppercase tracking-wider">
              Niveau de danger : <span className="font-bold text-white underline decoration-wavy decoration-yellow-400">{alert.dangerLevel}</span>
            </p>
          </div>
        </div>

        {/* Profile Card Section */}
        <div className="flex gap-5 bg-safe-card border border-safe-border p-5 rounded-3xl shadow-lg relative overflow-hidden group">
          {/* Faint ambient glow behind profile */}
          <div className="absolute -right-16 -top-16 w-32 h-32 bg-safe-red/5 rounded-full blur-2xl pointer-events-none" />
          
          {/* Photo */}
          <div className="w-28 h-32 rounded-2xl overflow-hidden shrink-0 border-2 border-safe-border/70 shadow-inner bg-safe-dark relative">
            <img src={alert.photoUrl} alt={alert.name} className="w-full h-full object-cover" />
          </div>
          
          {/* Details */}
          <div className="flex flex-col justify-center min-w-0">
            <h1 className="text-2xl font-black text-white leading-tight mb-1 truncate">{alert.name}</h1>
            <p className="text-gray-300 font-bold text-sm mb-2">{alert.age ? `${alert.age} ans` : 'Âge non précisé'}</p>
            <div className="space-y-1 text-xs text-gray-400 font-medium">
              <p className="truncate">{alert.height || 'Taille non précisée'}{alert.weight ? ` • Poids : ${alert.weight}` : ''}</p>
              <p className="truncate">{eyesText}</p>
              <p className="truncate">{hairText}</p>
            </div>
          </div>
        </div>

        {/* Section: Informations */}
        <div className="border-t border-safe-border/50 pt-5 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Informations</h3>
          <div className="space-y-3.5 text-sm text-gray-300">
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-safe-red mt-2 shrink-0 shadow-lg shadow-safe-red/50" />
              <p>
                <span className="text-gray-400">Disparue le </span>
                <span className="font-bold text-white">{formattedDate || 'Date inconnue'}</span>
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-safe-red mt-2 shrink-0 shadow-lg shadow-safe-red/50" />
              <div>
                <span className="text-gray-400">Dernière localisation connue :</span>
                <p className="font-bold text-white mt-1 pl-0">{alert.location}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Description */}
        <div className="border-t border-safe-border/50 pt-5 space-y-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Description</h3>
          <p className="text-sm leading-relaxed text-gray-300 bg-safe-card/45 border border-safe-border/40 p-4 rounded-2xl">
            {alert.clothing ? alert.clothing : (alert.description || "Aucune description détaillée disponible.")}
          </p>
        </div>

        {/* Section: Suspect Vehicle */}
        {parsedVehicle && (
          <div className="border-t border-safe-border/50 pt-5 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Car size={16} className="text-safe-red" /> Véhicule suspect
            </h3>
            
            <div className="flex justify-between items-center bg-[#141212] border border-safe-red/10 rounded-3xl p-5 shadow-lg relative overflow-hidden">
              {/* Background accent ring */}
              <div className="absolute right-0 bottom-0 w-24 h-24 bg-safe-red/5 rounded-full blur-xl pointer-events-none" />
              
              <div className="space-y-3 z-10 shrink-0">
                <span className="font-bold text-sm text-gray-200 block max-w-[200px] leading-tight">{parsedVehicle.text}</span>
                {parsedVehicle.plate && (
                  <span className="inline-block bg-safe-card border border-safe-border px-3.5 py-1.5 rounded-xl text-xs font-mono font-black text-white tracking-widest uppercase shadow-md">
                    {parsedVehicle.plate}
                  </span>
                )}
              </div>
              
              {/* Car photo cutout matching mockup */}
              <div className="w-36 h-20 shrink-0 z-10 select-none pointer-events-none flex items-center justify-center">
                <img 
                  src="/peugeot_308_gris.png" 
                  alt="Véhicule suspect" 
                  className="w-full h-full object-contain filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] transform scale-110"
                  onError={(e) => {
                    // Fallback to Car icon if image loading fails
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Section: Citizen Reports */}
        {reports.length > 0 && (
          <div className="border-t border-safe-border/50 pt-5 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <MessageSquare size={16} className="text-blue-500" /> Signalements récents ({reports.length})
            </h3>
            
            <div className="space-y-4">
              {reports.map(report => (
                <div key={report.id} className="bg-safe-card border border-safe-border rounded-2xl p-4 shadow-md transition-all hover:border-blue-500/20">
                  <div className="flex justify-between items-start mb-2.5">
                    <span className="text-[10px] font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-md uppercase tracking-wider">{report.report_type}</span>
                    <span className="text-xs text-gray-500 font-medium">{new Date(report.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                  {report.media_url && <img src={report.media_url} alt="media" className="w-full h-36 object-cover rounded-xl border border-safe-border mb-3" />}
                  {report.clean_description && <p className="text-sm text-gray-300 leading-relaxed font-serif">"{report.clean_description}"</p>}
                  <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-safe-border/30 text-xs">
                    {report.location && <span className="text-gray-500 font-medium truncate max-w-[150px]">📌 {report.location}</span>}
                    <span className="text-gray-500 font-bold ml-auto">Par {report.profiles?.name || 'Citoyen'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sticky Bottom CTA button */}
      <div className="fixed bottom-0 left-0 w-full bg-safe-dark/90 backdrop-blur-lg border-t border-safe-border/50 p-5 z-40 max-w-lg mx-auto right-0">
        <button 
          onClick={() => navigate(`/report/step-1?alertId=${alert.id}`)}
          className="w-full bg-safe-red text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-safe-red-hover active:scale-[0.98] transition-all shadow-xl shadow-safe-red/25 hover:shadow-safe-red/35"
        >
          <Eye size={20} className="shrink-0" />
          Je l'ai vue / J'ai des infos
        </button>
      </div>
    </div>
  );
}
