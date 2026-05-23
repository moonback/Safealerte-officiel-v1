import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Settings, Shield, Bell, FileText, LogOut, ChevronRight, Heart } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function ProfileScreen() {
  const { user, signOut, role } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen bg-safe-dark pb-24">
      <header className="pt-12 pb-6 px-6 bg-safe-card border-b border-safe-border flex flex-col items-center shadow-lg">
        <div className="w-24 h-24 rounded-full bg-safe-dark border-4 border-safe-border flex items-center justify-center mb-4 relative shadow-inner overflow-hidden">
          {user?.user_metadata?.avatar_url ? (
             <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
          ) : (
             <User size={40} className="text-gray-400" />
          )}
          <div className="absolute bottom-0 right-0 w-6 h-6 bg-safe-green rounded-full border-2 border-safe-card" />
        </div>
        <h1 className="text-xl font-bold">{user?.user_metadata?.name || 'Citoyen Anonyme'}</h1>
        <p className="text-sm text-gray-400 mt-1">{user?.email}</p>
        <span className="mt-2 text-xs font-bold uppercase tracking-widest bg-safe-dark px-3 py-1 rounded-full border border-safe-border text-gray-300">
           {role === 'admin' ? 'Administrateur' : role === 'membre_equipe' ? 'Équipe Recherche' : 'Citoyen'}
        </span>
        
        <div className="flex gap-4 mt-6 w-full">
          <div className="flex-1 bg-safe-dark rounded-2xl p-4 text-center border border-safe-border flex flex-col items-center justify-center">
            <span className="text-2xl font-black text-safe-blue mb-1">...</span>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Signalements</span>
          </div>
          <div className="flex-1 bg-safe-dark rounded-2xl p-4 text-center border border-safe-border flex flex-col items-center justify-center">
            <span className="text-2xl font-black text-safe-red mb-1">...</span>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Alerte relayées</span>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-8">
        {role === 'admin' && (
          <section>
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Administration</h2>
            <div className="bg-safe-card rounded-2xl border border-safe-border overflow-hidden">
              <MenuItem icon={Settings} label="Tableau de bord Admin" onClick={() => navigate('/admin')} color="text-safe-red" />
            </div>
          </section>
        )}

        <section>
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Paramètres du compte</h2>
          <div className="bg-safe-card rounded-2xl border border-safe-border overflow-hidden">
            <MenuItem icon={User} label="Informations personnelles" onClick={() => navigate('/profile/info')} />
            <MenuItem icon={Bell} label="Préférences de notification" />
            <MenuItem icon={Shield} label="Confidentialité et sécurité" />
          </div>
        </section>

        <section>
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Soutien & Légal</h2>
          <div className="bg-safe-card rounded-2xl border border-safe-border overflow-hidden">
            <MenuItem icon={Heart} label="Soutenir Safe Alert" color="text-pink-500" />
            <MenuItem icon={FileText} label="Conditions d'utilisation" />
          </div>
        </section>

        <button 
          onClick={() => signOut()}
          className="w-full bg-safe-card border border-safe-red/20 text-safe-red font-bold py-4 rounded-xl flex items-center justify-center gap-2 mt-4 hover:bg-safe-red hover:text-white transition-colors"
        >
          <LogOut size={20} />
          Se déconnecter
        </button>
      </div>
    </div>
  );
}

function MenuItem({ icon: Icon, label, color = "text-gray-400", onClick }: any) {
  return (
    <button onClick={onClick} className="w-full flex items-center justify-between p-4 border-b border-safe-border/50 last:border-0 hover:bg-white/5 active:bg-white/10 transition-colors">
      <div className="flex items-center gap-3">
        <Icon size={20} className={color} />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <ChevronRight size={16} className="text-gray-600" />
    </button>
  );
}
