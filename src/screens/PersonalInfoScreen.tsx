import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Camera, Save, Upload } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function PersonalInfoScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [name, setName] = useState(user?.user_metadata?.name || '');
  const [phone, setPhone] = useState(user?.user_metadata?.phone || '');
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(user?.user_metadata?.avatar_url || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      let avatarUrl = user?.user_metadata?.avatar_url;

      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${user?.id}_${Date.now()}.${fileExt}`;
        const { error: uploadError, data } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile);

        if (!uploadError && data) {
           const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(fileName);
           avatarUrl = publicData.publicUrl;
        }
      }

      const { error } = await supabase.auth.updateUser({
        data: {
          name: name,
          phone: phone,
          avatar_url: avatarUrl
        }
      });
      if (error) throw error;
      navigate(-1);
    } catch (err: any) {
      alert("Erreur lors de la mise à jour: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-safe-dark min-h-screen text-white flex flex-col">
      <header className="pt-12 pb-6 px-6 bg-safe-card border-b border-safe-border flex items-center gap-4 shadow-lg sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-2 bg-safe-dark rounded-full hover:bg-white/10 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold flex-1">Informations personnelles</h1>
      </header>

      <div className="flex-1 p-6 space-y-6">
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-safe-card border-4 border-safe-border flex items-center justify-center overflow-hidden">
               {previewUrl ? (
                 <img src={previewUrl} alt="Profile" className="w-full h-full object-cover" />
               ) : (
                 <User size={40} className="text-gray-400" />
               )}
            </div>
            
            <input 
              type="file" 
              accept="image/*"
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            <button 
               onClick={() => fileInputRef.current?.click()}
               className="absolute bottom-0 right-0 w-8 h-8 bg-safe-red rounded-full flex items-center justify-center border-2 border-safe-dark hover:bg-safe-red-hover transition-colors"
            >
              <Camera size={14} />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Nom complet</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User size={18} className="text-gray-400" />
              </div>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-safe-card border border-safe-border rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:border-safe-red transition-colors"
                placeholder="Votre nom"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Adresse Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail size={18} className="text-gray-400" />
              </div>
              <input 
                type="email" 
                value={user?.email || ''}
                readOnly
                className="w-full bg-safe-card/50 border border-safe-border rounded-xl py-3 pl-11 pr-4 text-gray-400 focus:outline-none"
              />
            </div>
            <p className="text-[10px] text-gray-500 mt-1.5 ml-1">L'adresse email ne peut pas être modifiée ici.</p>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Téléphone</label>
            <input 
              type="tel" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-safe-card border border-safe-border rounded-xl py-3 px-4 text-white focus:outline-none focus:border-safe-red transition-colors"
              placeholder="+33 6 12 34 56 78"
            />
          </div>
        </div>
      </div>

      <div className="p-6">
        <button 
          onClick={handleSave}
          disabled={loading}
          className="w-full bg-safe-red text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-safe-red-hover active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {loading ? (
             <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            <>
              <Save size={20} />
              Enregistrer les modifications
            </>
          )}
        </button>
      </div>
    </div>
  );
}
