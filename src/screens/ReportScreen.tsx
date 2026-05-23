import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, User, Car, Eye, HelpCircle, MapPin, Map, Camera, FileVideo, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

const reportMarkerIcon = new L.DivIcon({
  html: `<div class="relative flex h-10 w-10">
           <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-safe-red opacity-40"></span>
           <span class="relative flex items-center justify-center rounded-full h-10 w-10 bg-safe-red border-2 border-white shadow-xl">
             <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-white"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
           </span>
         </div>`,
  className: '',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

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
          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Step2 onNext={nextStep} coords={coords} setCoords={setCoords} />
            </motion.div>
          )}
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

function MapEventsHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapViewUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

function Step2({ 
  onNext, 
  coords, 
  setCoords 
}: { 
  onNext: () => void; 
  coords: { lat: number; lng: number } | null; 
  setCoords: (coords: { lat: number; lng: number } | null) => void; 
}) {
  const [isLocating, setIsLocating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const markerRef = useRef<any>(null);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg("La géolocalisation n'est pas supportée par votre navigateur.");
      return;
    }

    setIsLocating(true);
    setErrorMsg(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setIsLocating(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        let msg = "Impossible de récupérer votre position.";
        if (error.code === error.PERMISSION_DENIED) {
          msg = "Accès à la position refusé. Veuillez autoriser la localisation ou placer le repère manuellement.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = "Informations de localisation indisponibles.";
        } else if (error.code === error.TIMEOUT) {
          msg = "Délai d'attente dépassé pour récupérer votre position.";
        }
        setErrorMsg(msg);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const mapCenter: [number, number] = coords ? [coords.lat, coords.lng] : [46.603354, 1.888334];
  const mapZoom = coords ? 16 : 5;

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const latLng = marker.getLatLng();
          setCoords({ lat: latLng.lat, lng: latLng.lng });
        }
      },
    }),
    [setCoords],
  );

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-2xl font-bold mb-2">Où ?</h2>
      <p className="text-gray-400 text-sm mb-6">Indiquez l'endroit précis de votre observation.</p>
      
      <div className="space-y-4 mb-6">
        <button 
          onClick={handleGetCurrentLocation}
          disabled={isLocating}
          className={`w-full py-4 px-5 rounded-2xl flex items-center justify-between transition-all duration-300 border shadow-lg cursor-pointer ${
            coords 
              ? 'bg-safe-green/20 border-safe-green text-safe-green hover:bg-safe-green/30' 
              : 'bg-safe-red border-safe-red text-white hover:bg-safe-red-hover active:scale-[0.99]'
          }`}
        >
          <div className="flex items-center gap-3">
            {isLocating ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <MapPin size={22} className={coords ? 'text-safe-green' : 'text-white'} />
            )}
            <span className="font-bold">
              {isLocating 
                ? "Recherche de votre position..." 
                : coords 
                  ? "✓ Position capturée avec succès !" 
                  : "Utiliser ma position actuelle"}
            </span>
          </div>
          {!isLocating && !coords && (
            <span className="text-xs bg-white/20 px-2.5 py-1 rounded-full uppercase font-bold tracking-wider">GPS</span>
          )}
        </button>

        {errorMsg && (
          <div className="bg-safe-red/10 border border-safe-red/30 p-4 rounded-xl text-xs text-safe-red leading-relaxed">
            {errorMsg}
          </div>
        )}
      </div>

      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Sélection sur la carte</span>
          {coords && (
            <button 
              onClick={() => setCoords(null)}
              className="text-xs font-semibold text-safe-red hover:underline transition-all cursor-pointer"
            >
              Réinitialiser
            </button>
          )}
        </div>
        <p className="text-xs text-gray-400 mb-3 bg-white/5 border border-white/10 p-3 rounded-xl flex items-center gap-2">
          <Map size={14} className="text-safe-red shrink-0" />
          <span>Touchez la carte pour placer le repère, ou glissez le repère rouge pour affiner la position.</span>
        </p>

        {/* Dynamic Leaflet Map */}
        <div className="h-64 bg-safe-card border border-safe-border rounded-2xl overflow-hidden relative shadow-inner z-10">
          <MapContainer 
            center={mapCenter} 
            zoom={mapZoom} 
            style={{ height: '100%', width: '100%', background: '#0a0a0a' }}
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            
            <MapEventsHandler onMapClick={(lat, lng) => setCoords({ lat, lng })} />
            <MapViewUpdater center={mapCenter} zoom={mapZoom} />

            {coords && (
              <Marker 
                draggable={true}
                eventHandlers={eventHandlers}
                position={[coords.lat, coords.lng]}
                ref={markerRef}
                icon={reportMarkerIcon}
              />
            )}
          </MapContainer>
        </div>
      </div>

      {coords && (
        <div className="bg-safe-card border border-safe-border rounded-xl p-3 flex items-center justify-between text-xs font-mono text-gray-400 mb-6">
          <span className="flex items-center gap-1.5"><MapPin size={12} className="text-safe-green" /> Coordonnées :</span>
          <span className="text-white bg-black/40 px-2 py-1 rounded border border-white/5">
            {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
          </span>
        </div>
      )}

      <button 
        onClick={onNext} 
        disabled={!coords}
        className={`w-full font-bold py-4 rounded-xl transition-all duration-300 cursor-pointer ${
          coords 
            ? 'bg-white text-safe-dark hover:bg-gray-100 active:scale-[0.98]' 
            : 'bg-safe-card text-gray-600 border border-safe-border cursor-not-allowed'
        }`}
      >
        {coords ? "Continuer" : "Veuillez indiquer un emplacement"}
      </button>
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
