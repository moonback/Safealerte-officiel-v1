import React, { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, User, Car, Eye, HelpCircle, MapPin, Map, Camera, FileVideo, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function ReportScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const alertId = searchParams.get('alertId');
  const step = parseInt(location.pathname.split('-')[1]) || 1;
  const { user } = useAuth();

  // Consolidated state for the stepper
  const [reportType, setReportType] = useState('Autre');
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);
  const [description, setDescription] = useState('');
  const [clothing, setClothing] = useState('');
  const [direction, setDirection] = useState('');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const nextStep = () => navigate(`/report/step-${step + 1}${alertId ? `?alertId=${alertId}` : ''}`);
  const prevStep = () => {
    if (step > 1) navigate(`/report/step-${step - 1}${alertId ? `?alertId=${alertId}` : ''}`);
    else navigate(-1);
  };

  const submit = async () => {
    if (!user) {
      alert("Vous devez être connecté pour envoyer un signalement.");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // 1. Upload Media
      let mediaUrls: string[] = [];
      if (mediaFiles.length > 0) {
        for (const file of mediaFiles) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${user.id}_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          const { error: uploadError, data } = await supabase.storage
            .from('reports_media')
            .upload(fileName, file);

          if (!uploadError && data) {
             const { data: publicData } = supabase.storage.from('reports_media').getPublicUrl(fileName);
             mediaUrls.push(publicData.publicUrl);
          }
        }
      }

      // 2. Insert Report
      const firstMediaUrl = mediaUrls.length > 0 ? mediaUrls[0] : null;
      let extraUrlsText = '';
      if (mediaUrls.length > 0) {
        extraUrlsText = `\nMedias: \n` + mediaUrls.map(url => `- ${url}`).join('\n');
      }

      let fullDescription = description;
      if (clothing) fullDescription += `\nTenue: ${clothing}`;
      if (direction) fullDescription += `\nDirection de fuite: ${direction}`;
      fullDescription += (extraUrlsText ? extraUrlsText : '');

      const { error } = await supabase.from('reports').insert({
        report_type: reportType,
        location: coords ? 'Position GPS' : 'Position non précisée',
        latitude: coords?.lat,
        longitude: coords?.lng,
        description: fullDescription,
        user_id: user.id,
        alert_id: alertId || null
      });

      if (error) throw error;
      
      // Success: redirect to home
      navigate('/home');
    } catch (err: any) {
      console.error(err);
      alert("Erreur lors de l'envoi du signalement : " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-safe-dark p-6">
      <header className="flex justify-between items-center pt-8 mb-8">
        <button onClick={prevStep} className="p-2 bg-safe-card rounded-full text-white">
          <ArrowLeft size={20} />
        </button>
        <span className="font-bold text-lg">Signalement</span>
        <div className="w-9" /> {/* spacer */}
      </header>

      {/* Stepper Progress */}
      <div className="flex gap-2 mb-10">
        {[1, 2, 3].map(i => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? 'bg-safe-red' : 'bg-safe-card border border-safe-border'}`} />
        ))}
      </div>

      <div className="flex-1">
        <AnimatePresence mode="wait">
          {step === 1 && <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}><Step1 onSelect={(type) => { setReportType(type); nextStep(); }} selectedType={reportType} /></motion.div>}
          {step === 2 && <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}><Step2 onNext={nextStep} onGetLocation={() => setCoords({lat: 45.75, lng: 4.85})} hasLocation={!!coords} /></motion.div>}
          {step === 3 && <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}><Step3 onSubmit={submit} description={description} setDescription={setDescription} clothing={clothing} setClothing={setClothing} direction={direction} setDirection={setDirection} setMediaFiles={setMediaFiles} mediaFiles={mediaFiles} isSubmitting={isSubmitting} /></motion.div>}
        </AnimatePresence>
      </div>

    </div>
  );
}

function Step1({ onSelect, selectedType }: { onSelect: (type: string) => void, selectedType: string }) {
  const options = [
    { icon: User, label: "Personne vue", desc: "J'ai aperçu la personne recherchée" },
    { icon: Car, label: "Véhicule suspect", desc: "Correspondant au véhicule recherché" },
    { icon: Eye, label: "Comportement suspect", desc: "Rôdeur, situation anormale" },
    { icon: HelpCircle, label: "Autre", desc: "Toute autre information utile" },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Que signalez-vous ?</h2>
      <p className="text-gray-400 text-sm mb-8">Sélectionnez la catégorie qui correspond le mieux à votre observation.</p>
      
      <div className="space-y-4">
        {options.map((opt, i) => (
          <button 
            key={i} 
            onClick={() => onSelect(opt.label)}
            className={`w-full bg-safe-card border ${selectedType === opt.label ? 'border-safe-red' : 'border-safe-border'} p-4 rounded-2xl flex items-center gap-4 hover:border-safe-red transition-colors text-left`}
          >
            <div className={`p-3 rounded-xl text-white ${selectedType === opt.label ? 'bg-safe-red' : 'bg-safe-dark'}`}>
              <opt.icon size={24} />
            </div>
            <div>
              <h3 className="font-bold text-base mb-1">{opt.label}</h3>
              <p className="text-xs text-gray-400">{opt.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function Step2({ onNext, onGetLocation, hasLocation }: { onNext: () => void, onGetLocation: () => void, hasLocation: boolean }) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Où ?</h2>
      <p className="text-gray-400 text-sm mb-8">Indiquez l'endroit précis de votre observation.</p>
      
      <div className="space-y-4 mb-8">
        <button 
          onClick={onGetLocation}
          className={`w-full ${hasLocation ? 'bg-safe-green border-safe-green' : 'bg-safe-red border-safe-red/50'} border p-4 rounded-2xl flex items-center justify-between text-left text-white transition-colors`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-black/20 rounded-lg">
              <MapPin size={24} />
            </div>
            <span className="font-bold">{hasLocation ? "Position capturée !" : "Utiliser ma position actuelle"}</span>
          </div>
        </button>
        
        <button 
          className="w-full bg-safe-card border border-safe-border p-4 rounded-2xl flex items-center justify-between text-left hover:border-gray-500 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-safe-dark rounded-lg text-gray-400">
              <Map size={24} />
            </div>
            <span className="font-bold">Placer sur la carte manuellement</span>
          </div>
        </button>
      </div>

      {/* Mini map snippet */}
      <div className="h-40 bg-safe-card border border-safe-border rounded-2xl flex items-center justify-center opacity-50 relative overflow-hidden mb-8">
        <Map size={32} className="text-gray-600" />
        <span className="absolute bottom-4 text-xs text-gray-500">Aperçu carte</span>
      </div>

      <button onClick={onNext} className="w-full bg-white text-safe-dark font-bold py-4 rounded-xl active:scale-[0.98] transition-transform">Continuer</button>
    </div>
  );
}

function Step3({ onSubmit, description, setDescription, clothing, setClothing, direction, setDirection, setMediaFiles, mediaFiles, isSubmitting }: any) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setMediaFiles((prev: File[]) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setMediaFiles((prev: File[]) => prev.filter((_, i) => i !== index));
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Médias & Détails</h2>
      <p className="text-gray-400 text-sm mb-8">Ajoutez des photos ou une description si votre sécurité le permet.</p>
      
      <div className="mb-6">
        <input 
          type="file" 
          accept="image/*,video/*"
          multiple
          className="hidden" 
          ref={fileInputRef}
          onChange={handleFileChange}
        />
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="w-full bg-safe-card border border-dashed border-safe-border p-6 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-safe-border transition-colors relative overflow-hidden"
        >
          <Camera size={28} className="text-safe-red" />
          <span className="text-xs font-bold mt-1">Ajouter des Médias (Photos/Vidéos)</span>
        </button>
        
        {mediaFiles.length > 0 && (
          <div className="flex gap-3 mt-4 overflow-x-auto pb-2">
            {mediaFiles.map((file: File, idx: number) => (
              <div key={idx} className="relative w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-safe-dark border border-safe-border flex items-center justify-center">
                <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                <button onClick={() => removeFile(idx)} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-safe-red">
                  <Upload size={10} className="rotate-45" /> {/* Close icon lookalike */}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4 mb-8">
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Vêtements / Apparence</label>
          <input 
            type="text"
            value={clothing}
            onChange={(e) => setClothing(e.target.value)}
            placeholder="Ex: Veste rouge, jean bleu..."
            className="w-full bg-safe-card border border-safe-border rounded-xl p-4 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-safe-red"
          />
        </div>
        
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Direction / Véhicule</label>
          <input 
            type="text"
            value={direction}
            onChange={(e) => setDirection(e.target.value)}
            placeholder="Ex: Parti vers la gare, en clio noire..."
            className="w-full bg-safe-card border border-safe-border rounded-xl p-4 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-safe-red"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Informations complémentaires</label>
          <textarea 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Toute autre information utile..."
            className="w-full h-24 bg-safe-card border border-safe-border rounded-xl p-4 text-sm text-white placeholder:text-gray-500 resize-none focus:outline-none focus:border-safe-red break-words"
          />
        </div>
      </div>

      <button 
        onClick={onSubmit} 
        disabled={isSubmitting}
        className="w-full bg-safe-red text-white font-bold py-4 rounded-xl sticky bottom-6 shadow-[0_0_20px_rgba(229,57,53,0.3)] active:scale-[0.98] transition-transform disabled:opacity-50"
      >
        {isSubmitting ? "Envoi en cours..." : "Envoyer le signalement"}
      </button>
    </div>
  );
}
