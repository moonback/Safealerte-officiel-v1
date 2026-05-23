import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Share2, AlertTriangle, Car, Calendar, MapPin, Search, Eye, MessageSquare } from 'lucide-react';
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

  if (loading || !alert) {
     return <div className="min-h-screen bg-safe-dark flex justify-center items-center"><div className="animate-spin w-8 h-8 border-4 border-safe-red border-t-transparent rounded-full" /></div>
  }

  return (
    <div className="bg-safe-dark min-h-screen text-white pb-24">
      {/* Header Overlay */}
      <div className="bg-safe-red pt-10 pb-20 px-6 relative rounded-b-[40px] shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <button onClick={() => navigate(-1)} className="p-2 bg-white/20 rounded-full text-white backdrop-blur-sm hover:bg-white/30 transition-colors">
            <ArrowLeft size={24} />
          </button>
          <button className="p-2 bg-white/20 rounded-full text-white backdrop-blur-sm hover:bg-white/30 transition-colors">
            <Share2 size={24} />
          </button>
        </div>
        
        <div className="text-center">
          <span className="text-white/80 font-bold uppercase tracking-widest text-xs mb-2 block text-center">
            {alert.type === 'child_abduction' ? "Alerte Enlèvement" : "Personne Disparue"}
          </span>
          <h1 className="text-3xl font-black text-white text-center mb-4">{alert.name}</h1>
          <div className="inline-flex items-center gap-1.5 bg-black/30 px-3 py-1.5 rounded-full text-xs font-semibold text-white/90">
            <AlertTriangle size={14} className="text-yellow-400" />
            Niveau de danger : {alert.dangerLevel}
          </div>
        </div>
      </div>

      {/* Main Content Card (overlapping header) */}
      <div className="px-5 -mt-12 relative z-10">
        
        {/* Photo Container */}
        <div className="flex justify-center mb-6">
          <div className="w-32 h-32 rounded-full border-4 border-safe-dark bg-safe-card overflow-hidden shadow-2xl relative">
            <img src={alert.photoUrl} alt={alert.name} className="w-full h-full object-cover" />
            <div className="absolute bottom-0 w-full bg-safe-red/90 py-1 text-center text-[10px] font-bold">
              {alert.age ? `${alert.age} ANS` : "ÂGE INCONNU"}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Section: Informations générales */}
          <section className="bg-safe-card border border-safe-border rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Search size={16} /> Signalement
            </h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <span className="text-xs text-gray-500 block">Taille</span>
                <span className="font-semibold">{alert.height}</span>
              </div>
              {alert.weight && (
                <div>
                  <span className="text-xs text-gray-500 block">Poids</span>
                  <span className="font-semibold">{alert.weight}</span>
                </div>
              )}
              <div>
                <span className="text-xs text-gray-500 block">Âge</span>
                <span className="font-semibold">{alert.age ? `${alert.age} ans` : 'Non précisé'}</span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Yeux</span>
                <span className="font-semibold">{alert.eyeColor}</span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Cheveux</span>
                <span className="font-semibold">{alert.hairColor}</span>
              </div>
            </div>

            {alert.clothing && (
              <div className="border-t border-safe-border/70 pt-4 mb-4">
                <span className="text-xs text-gray-500 block mb-1">Tenue vestimentaire</span>
                <p className="text-sm leading-relaxed">{alert.clothing}</p>
              </div>
            )}

            <div className="border-t border-safe-border/70 pt-4">
              <span className="text-xs text-gray-500 block mb-1">Signes particuliers / Description</span>
              <p className="text-sm leading-relaxed">{alert.description || "Aucune description détaillée."}</p>
            </div>
          </section>

          {/* Section: CIRCONSTANCES */}
          <section className="bg-safe-card border border-safe-border rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <ClockIcon size={16} /> Disparition
            </h3>
            
            <div className="space-y-4">
              <div className="flex gap-3">
                <Calendar size={20} className="text-gray-500 shrink-0" />
                <div>
                  <span className="text-xs text-gray-500 block">Date et Heure</span>
                  <span className="text-sm font-medium">Vu(e) pour la dernière fois le {new Date(alert.lastSeen).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
              <div className="flex gap-3">
                <MapPin size={20} className="text-gray-500 shrink-0" />
                <div>
                  <span className="text-xs text-gray-500 block">Dernière localisation</span>
                  <span className="text-sm font-medium">{alert.location}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Section: Véhicule Suspect */}
          {alert.suspectVehicle && alert.suspectVehicle !== "Aucun" && (
            <section className="bg-[#1A1111] border border-safe-red/20 rounded-2xl p-5 relative overflow-hidden shadow-sm">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <Car size={80} />
              </div>
              <h3 className="text-sm font-bold text-safe-red uppercase tracking-wider mb-2 flex items-center gap-2">
                <Car size={16} /> Véhicule suspect
              </h3>
              <p className="text-sm font-medium">Détails : {alert.suspectVehicle}</p>
            </section>
          )}

          {/* Section: Signalements Citoyens (Citizen Reports) */}
          {reports.length > 0 && (
             <section className="bg-safe-card border border-safe-border rounded-2xl p-5 shadow-sm">
               <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                 <MessageSquare size={16} /> Derniers Signalements
               </h3>
               
               <div className="space-y-4">
                 {reports.map(report => (
                   <div key={report.id} className="bg-safe-dark border border-safe-border rounded-xl p-3">
                     <div className="flex justify-between items-start mb-2">
                       <span className="text-xs font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded uppercase">{report.report_type}</span>
                       <span className="text-xs text-gray-400">{new Date(report.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                     </div>
                     {report.media_url && <img src={report.media_url} alt="media" className="w-full h-32 object-cover rounded-lg mb-2" />}
                     {report.clean_description && <p className="text-sm text-gray-300 italic whitespace-pre-wrap">"{report.clean_description}"</p>}
                     <p className="text-xs text-gray-500 mt-2 text-right">Par {report.profiles?.name || 'Anonyme'}</p>
                   </div>
                 ))}
               </div>
             </section>
          )}

        </div>
      </div>

      {/* Sticky CTA Footer */}
      <div className="fixed bottom-0 left-0 w-full bg-safe-dark/95 backdrop-blur-md border-t border-safe-border p-5 z-50">
        <button 
          onClick={() => navigate(`/report/step-1?alertId=${alert.id}`)}
          className="w-full bg-safe-red text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-safe-red-hover active:scale-[0.98] transition-all shadow-lg shadow-safe-red/20"
        >
          <Eye size={20} />
          J'ai des informations
        </button>
      </div>
    </div>
  );
}

function ClockIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
  )
}
