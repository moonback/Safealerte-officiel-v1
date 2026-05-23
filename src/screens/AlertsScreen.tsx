import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, MapPin, ChevronRight, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import { useAlerts } from '../hooks/useAlerts';

export default function AlertsScreen() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('En cours');
  const tabs = ['En cours', 'Proches', 'Résolues'];
  const { alerts, loading } = useAlerts();

  return (
    <div className="flex flex-col min-h-screen bg-safe-dark p-6 pb-24">
      <header className="pt-8 mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <Bell className="text-safe-red" size={28} /> Alertes
        </h1>
        <p className="text-gray-400 text-sm mt-2">Suivez les signalements dans votre région.</p>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-4 hide-scrollbar">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors whitespace-nowrap ${
              activeTab === tab ? 'bg-safe-red text-white' : 'bg-safe-card text-gray-400 border border-safe-border'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto space-y-4 pt-2">
        {loading ? (
           <div className="flex justify-center p-10"><div className="animate-spin w-8 h-8 border-4 border-safe-red border-t-transparent rounded-full" /></div>
        ) : alerts.length === 0 ? (
           <div className="text-center text-gray-500 py-10">Aucune alerte correspondante.</div>
        ) : alerts.map((alert, i) => (
          <motion.div 
            key={alert.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => navigate(`/alert/${alert.id}`)}
            className="bg-safe-card border border-safe-border rounded-2xl p-4 active:scale-[0.98] transition-transform cursor-pointer shadow-lg"
          >
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-safe-border">
                <img src={alert.photoUrl} alt={alert.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-white text-base">{alert.name}</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-safe-red/20 text-safe-red">
                    {alert.dangerLevel}
                  </span>
                </div>
                <div className="text-xs text-gray-400 mb-2 flex items-center gap-1.5">
                  <MapPin size={12} /> {alert.location}
                </div>
                <p className="text-sm text-gray-300 line-clamp-2 leading-relaxed">{alert.description || 'Aucune description fournie.'}</p>
              </div>
            </div>
            {alert.type === 'child_abduction' && (
               <div className="mt-4 pt-3 border-t border-safe-border/50 flex items-center justify-between">
                 <div className="flex items-center gap-1.5 text-safe-red text-xs font-bold tracking-wide">
                   <AlertTriangle size={14} /> ALERTE ENLÈVEMENT
                 </div>
                 <ChevronRight size={16} className="text-gray-500" />
               </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
