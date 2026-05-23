import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Upload, Save, Car, MapPin, AlignLeft, User, Calendar, Clock, X, AlertTriangle } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

const customMarkerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function LocationPickerConfig({ position, setPosition }: any) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });
  return position ? <Marker position={position} icon={customMarkerIcon} /> : null;
}

export default function EditAlertScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [alertType, setAlertType] = useState('child_abduction');
  const [victimName, setVictimName] = useState('');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [eyeColor, setEyeColor] = useState('Marron');
  const [hairColor, setHairColor] = useState('Brun');
  const [clothing, setClothing] = useState('');
  const [description, setDescription] = useState('');
  
  const [vehicleBrand, setVehicleBrand] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleColor, setVehicleColor] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  
  const [location, setLocation] = useState('');
  const [mapCoords, setMapCoords] = useState<{lat: number, lng: number} | null>(null);
  
  const [missingSinceDate, setMissingSinceDate] = useState('');
  const [missingSinceTime, setMissingSinceTime] = useState('');
  const [dangerLevel, setDangerLevel] = useState('ÉLEVÉ');
  const [status, setStatus] = useState('EN COURS');
  
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadAlert() {
      if (!id) return;
      try {
        const { data, error } = await supabase.from('alerts').select('*').eq('id', id).single();
        if (error) throw error;
        if (data) {
          setAlertType(data.type || 'missing_person');
          setVictimName(data.victim_name || '');
          setAge(data.age ? data.age.toString() : '');
          setHeight(data.height || '');
          setLocation(data.location || '');
          setDangerLevel(data.danger_level || 'ÉLEVÉ');
          setStatus(data.status || 'EN COURS');
          
          if (data.latitude && data.longitude) {
            setMapCoords({ lat: data.latitude, lng: data.longitude });
          }

          if (data.missing_since) {
            const dateObj = new Date(data.missing_since);
            setMissingSinceDate(dateObj.toISOString().split('T')[0]);
            setMissingSinceTime(dateObj.toTimeString().substring(0, 5));
          }

          if (data.suspect_vehicle) {
            const parts = data.suspect_vehicle.split(' ');
            if (parts.length > 0) setVehicleBrand(parts[0]);
            if (parts.length > 1) setVehicleModel(parts[1]);
            if (parts.length > 2) setVehicleColor(parts[2]);
            if (parts.length > 3) setVehiclePlate(parts.slice(3).join(' '));
          }

          let cleanDesc = data.description || '';
          const photoMatch = cleanDesc.match(/Photo:\s*(https:\/\/[^\s]+)/);
          if (photoMatch) {
            setPreviewUrl(photoMatch[1]);
          }

          const eyesMatch = cleanDesc.match(/Yeux:\s*([^\n]+)/);
          const hairMatch = cleanDesc.match(/Cheveux:\s*([^\n]+)/);
          const weightMatch = cleanDesc.match(/Poids approx:\s*([^\n]+)/);
          const clothMatch = cleanDesc.match(/Tenue:\s*([^\n]+)/);

          if (eyesMatch) setEyeColor(eyesMatch[1].trim());
          if (hairMatch) setHairColor(hairMatch[1].trim());
          if (weightMatch) setWeight(weightMatch[1].trim());
          if (clothMatch) setClothing(clothMatch[1].trim());

          cleanDesc = cleanDesc
            .replace(/Photo:\s*https:\/\/[^\s]+/, '')
            .replace(/Yeux:\s*[^\n]+/, '')
            .replace(/Cheveux:\s*[^\n]+/, '')
            .replace(/Poids approx:\s*[^\n]+/, '')
            .replace(/Tenue:\s*[^\n]+/, '')
            .trim();

          setDescription(cleanDesc);
        }
      } catch (err) {
        console.error(err);
        alert('Erreur lors du chargement de l\'alerte');
      } finally {
        setFetching(false);
      }
    }
    loadAlert();
  }, [id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!victimName || !location) {
      alert("Veuillez remplir les champs obligatoires (Nom, Localisation).");
      return;
    }

    setLoading(true);
    try {
      let photoUrl = previewUrl && previewUrl.startsWith('http') ? previewUrl : null;

      // Upload new photo if exists
      if (photoFile) {
        const fileExt = photoFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const { error: uploadError, data } = await supabase.storage
          .from('alerts')
          .upload(fileName, photoFile);

        if (!uploadError && data) {
           const { data: publicData } = supabase.storage.from('alerts').getPublicUrl(fileName);
           photoUrl = publicData.publicUrl;
        }
      }

      let lat = mapCoords?.lat || null;
      let lng = mapCoords?.lng || null;
      
      let missingSince = null;
      if (missingSinceDate && missingSinceTime) {
         missingSince = new Date(`${missingSinceDate}T${missingSinceTime}`).toISOString();
      } else if (missingSinceDate) {
         missingSince = new Date(missingSinceDate).toISOString();
      }
      
      let vehicleText = '';
      if (vehicleBrand || vehicleModel || vehicleColor || vehiclePlate) {
         vehicleText = `${vehicleBrand} ${vehicleModel} ${vehicleColor} ${vehiclePlate}`.trim();
      }

      let fullDesc = description;
      if (clothing) fullDesc += `\nTenue: ${clothing}`;
      if (eyeColor) fullDesc += `\nYeux: ${eyeColor}`;
      if (hairColor) fullDesc += `\nCheveux: ${hairColor}`;
      if (weight) fullDesc += `\nPoids approx: ${weight}`;
      if (photoUrl) fullDesc += `\nPhoto: ${photoUrl}`;

      const { error } = await supabase.from('alerts').update({
        type: alertType,
        victim_name: victimName,
        age: age ? parseInt(age) : null,
        height: height || null,
        description: fullDesc,
        suspect_vehicle: vehicleText || null,
        location: location,
        danger_level: dangerLevel,
        status: status,
        latitude: lat,
        longitude: lng,
        missing_since: missingSince
      }).eq('id', id);

      if (error) throw error;
      
      alert("Alerte modifiée avec succès.");
      navigate('/admin');
    } catch (error: any) {
      console.error(error);
      alert("Erreur lors de la modification de l'alerte: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <AdminLayout activeTab="dashboard">
        <div className="flex-1 flex items-center justify-center h-full w-full">
           <div className="animate-spin w-8 h-8 border-4 border-safe-red border-t-transparent rounded-full" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout activeTab="dashboard">
      <div className="flex-1 flex flex-col items-center w-full p-4 md:p-6 lg:p-8">
        <div className="w-full max-w-3xl bg-[#111] border border-safe-border rounded-3xl overflow-hidden shadow-2xl">
          <header className="px-6 py-5 border-b border-safe-border bg-black/50 backdrop-blur-md flex items-center justify-between sticky top-0 z-20">
            <div className="flex items-center gap-4">
              <button type="button" onClick={() => navigate(-1)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-lg md:text-xl font-bold flex items-center gap-2">
                  <Save className="text-safe-red" size={24} /> 
                  Modifier l'Alerte
                </h1>
                <p className="text-xs md:text-sm text-gray-400">Mise à jour des informations</p>
              </div>
            </div>
          </header>

          <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-10">
            
            {/* Status Section */}
            <section className="space-y-5 relative">
              <div className="absolute -left-6 md:-left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-gray-500/50 to-transparent rounded-r-full" />
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <span className="w-6 h-px bg-gray-700"></span>
                Statut
              </h2>
              <div>
                 <label className="text-xs font-bold text-gray-400 mb-2 block">Statut de l'alerte</label>
                 <select 
                  value={status} 
                  onChange={e => setStatus(e.target.value)}
                  className="w-full bg-safe-card border border-safe-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-safe-red transition-colors font-bold"
                >
                  <option value="EN COURS" className="text-safe-red">EN COURS</option>
                  <option value="RÉSOLU" className="text-green-500">RÉSOLU (Personne retrouvée)</option>
                  <option value="ANNULÉ" className="text-gray-500">ANNULÉ</option>
                </select>
              </div>
            </section>

            {/* Infos Principales */}
            <section className="space-y-5 relative">
              <div className="absolute -left-6 md:-left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-safe-red/50 to-transparent rounded-r-full" />
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <span className="w-6 h-px bg-gray-700"></span>
                Informations Principales
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-xs font-bold text-gray-400 mb-2 block">Type de disparition *</label>
                  <select 
                    value={alertType} 
                    onChange={e => setAlertType(e.target.value)}
                    className="w-full bg-safe-card border border-safe-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-safe-red transition-colors"
                  >
                    <option value="child_abduction">Alerte Enlèvement (Enfant)</option>
                    <option value="missing_person">Disparition Inquiétante (Majeur)</option>
                    <option value="vulnerable_person">Disparition Personne Vulnérable (Alzheimer...)</option>
                    <option value="runaway_minor">Fugue (Mineur)</option>
                    <option value="runaway_adult">Fugue (Majeur)</option>
                  </select>
                </div>
                <div>
                   <label className="text-xs font-bold text-gray-400 mb-2 block">Niveau de danger *</label>
                   <select 
                    value={dangerLevel} 
                    onChange={e => setDangerLevel(e.target.value)}
                    className="w-full bg-safe-card border border-safe-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-safe-red transition-colors font-bold"
                  >
                    <option value="TRÈS ÉLEVÉ" className="text-red-500 font-bold">TRÈS ÉLEVÉ (Immédiat)</option>
                    <option value="ÉLEVÉ" className="text-orange-500">ÉLEVÉ</option>
                    <option value="MOYEN" className="text-yellow-500">MOYEN</option>
                    <option value="FAIBLE" className="text-green-500">FAIBLE</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 mb-2 block">Nom et Prénom *</label>
                <div className="relative">
                  <User className="absolute left-4 top-3.5 text-gray-500" size={18} />
                  <input 
                    type="text" 
                    required
                    value={victimName}
                    onChange={e => setVictimName(e.target.value)}
                    placeholder="Ex: Lucas D."
                    className="w-full bg-safe-card border border-safe-border rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-safe-red transition-colors" 
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="text-xs font-bold text-gray-400 mb-2 block">Âge (ans)</label>
                  <input 
                    type="number" 
                    value={age}
                    onChange={e => setAge(e.target.value)}
                    placeholder="Ex: 8"
                    className="w-full bg-safe-card border border-safe-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-safe-red transition-colors" 
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 mb-2 block">Taille (ex: 1m30)</label>
                  <input 
                    type="text" 
                    value={height}
                    onChange={e => setHeight(e.target.value)}
                    placeholder="Ex: 1m30"
                    className="w-full bg-safe-card border border-safe-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-safe-red transition-colors" 
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 mb-2 block">Poids approx.</label>
                  <input 
                    type="text" 
                    value={weight}
                    onChange={e => setWeight(e.target.value)}
                    placeholder="Ex: 35kg"
                    className="w-full bg-safe-card border border-safe-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-safe-red transition-colors" 
                  />
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-400 mb-2 block">Couleur des yeux</label>
                    <input 
                      type="text" 
                      value={eyeColor}
                      onChange={e => setEyeColor(e.target.value)}
                      placeholder="Ex: Marron"
                      className="w-full bg-safe-card border border-safe-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-safe-red transition-colors" 
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-400 mb-2 block">Couleur de cheveux</label>
                    <input 
                      type="text" 
                      value={hairColor}
                      onChange={e => setHairColor(e.target.value)}
                      placeholder="Ex: Brun"
                      className="w-full bg-safe-card border border-safe-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-safe-red transition-colors" 
                    />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 mb-2 block">Tenue vestimentaire</label>
                <input 
                    type="text" 
                    value={clothing}
                    onChange={e => setClothing(e.target.value)}
                    placeholder="Ex: T-shirt blanc, jean bleu, veste noire"
                    className="w-full bg-safe-card border border-safe-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-safe-red transition-colors" 
                />
              </div>
            </section>

            {/* Photo */}
            <section className="space-y-5 relative">
               <div className="absolute -left-6 md:-left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500/50 to-transparent rounded-r-full" />
               <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                 <span className="w-6 h-px bg-gray-700"></span>
                 Photo d'identification
               </h2>
               
               <div className="flex flex-col md:flex-row gap-6 items-start md:items-center bg-safe-card border border-safe-border p-5 rounded-2xl">
                  {previewUrl ? (
                    <div className="relative w-32 h-32 rounded-xl overflow-hidden shrink-0 border border-safe-border group">
                      <img src={previewUrl} alt="Aperçu" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                      <button 
                        type="button" 
                        onClick={removePhoto} 
                        className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={24} className="text-white" />
                      </button>
                    </div>
                  ) : (
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-32 h-32 rounded-xl bg-safe-dark border border-dashed border-gray-600 flex flex-col items-center justify-center overflow-hidden shrink-0 cursor-pointer hover:border-gray-400 hover:bg-gray-800 transition-colors"
                    >
                      <Upload className="text-gray-400 mb-2" size={24} />
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Ajouter Image</span>
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <h3 className="font-bold text-white mb-1">Média associé</h3>
                    <p className="text-xs text-gray-400 mb-4 leading-relaxed">Une photo récente et claire aide considérablement les recherches. Privilégiez un portrait bien éclairé, sans lunettes de soleil si possible.</p>
                    <input 
                      type="file" 
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-colors inline-block"
                    >
                      {previewUrl ? "Changer l'image" : "Sélectionner un fichier"}
                    </button>
                  </div>
               </div>
            </section>

            {/* Détails */}
            <section className="space-y-5 relative">
              <div className="absolute -left-6 md:-left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-yellow-500/50 to-transparent rounded-r-full" />
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <span className="w-6 h-px bg-gray-700"></span>
                Détails Opérationnels
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 mb-2 block">Dernière Localisation Connue *</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-3.5 text-gray-500" size={18} />
                    <input 
                      type="text" 
                      required
                      value={location}
                      onChange={e => setLocation(e.target.value)}
                      placeholder="Ex: Parc de la Tête d'Or, Lyon"
                      className="w-full bg-safe-card border border-safe-border rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-safe-red transition-colors" 
                    />
                  </div>
                </div>
                <div className="bg-[#0a0a0a] border border-safe-border rounded-xl h-48 overflow-hidden relative z-0">
                  <MapContainer 
                    center={mapCoords ? [mapCoords.lat, mapCoords.lng] : [46.603354, 1.888334]} 
                    zoom={mapCoords ? 13 : 5} 
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
                      url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    />
                    <LocationPickerConfig position={mapCoords} setPosition={setMapCoords} />
                  </MapContainer>
                  <div className="absolute top-2 left-2 z-[400] bg-black/60 backdrop-blur-sm text-xs text-white px-3 py-1.5 rounded-lg border border-white/10 pointer-events-none">
                    {mapCoords ? `Sélectionné : ${mapCoords.lat.toFixed(4)}, ${mapCoords.lng.toFixed(4)}` : "Cliquez sur la carte pour définir la position GPS"}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                 <div>
                    <label className="text-xs font-bold text-gray-400 mb-2 block">Date de disparition</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-3.5 text-gray-500" size={18} />
                      <input 
                        type="date"
                        value={missingSinceDate}
                        onChange={e => setMissingSinceDate(e.target.value)}
                        className="w-full bg-safe-card border border-safe-border rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-safe-red transition-colors appearance-none" 
                      />
                    </div>
                 </div>
                 <div>
                    <label className="text-xs font-bold text-gray-400 mb-2 block">Heure (Approximative)</label>
                    <div className="relative">
                      <Clock className="absolute left-4 top-3.5 text-gray-500" size={18} />
                      <input 
                        type="time"
                        value={missingSinceTime}
                        onChange={e => setMissingSinceTime(e.target.value)}
                        className="w-full bg-safe-card border border-safe-border rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-safe-red transition-colors appearance-none" 
                      />
                    </div>
                 </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 mb-2 block">Description vestimentaire / signes particuliers</label>
                <div className="relative">
                  <AlignLeft className="absolute left-4 top-4 text-gray-500" size={18} />
                  <textarea 
                    rows={4}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Vêtements portés, sac à dos, signes distinctifs (tatouages, cicatrices), direction de fuite potentielle..."
                    className="w-full bg-safe-card border border-safe-border rounded-xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-safe-red resize-none transition-colors" 
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 mb-2 block">Véhicule Suspect (Optionnel)</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="relative">
                    <Car className="absolute left-4 top-3.5 text-gray-500" size={18} />
                    <input 
                      type="text" 
                      value={vehicleBrand}
                      onChange={e => setVehicleBrand(e.target.value)}
                      placeholder="Marque (ex: Renault)"
                      className="w-full bg-safe-card border border-safe-border rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-safe-red transition-colors" 
                    />
                  </div>
                  <input 
                    type="text" 
                    value={vehicleModel}
                    onChange={e => setVehicleModel(e.target.value)}
                    placeholder="Modèle (ex: Clio)"
                    className="w-full bg-safe-card border border-safe-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-safe-red transition-colors" 
                  />
                  <input 
                    type="text" 
                    value={vehicleColor}
                    onChange={e => setVehicleColor(e.target.value)}
                    placeholder="Couleur (ex: Noire)"
                    className="w-full bg-safe-card border border-safe-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-safe-red transition-colors" 
                  />
                  <input 
                    type="text" 
                    value={vehiclePlate}
                    onChange={e => setVehiclePlate(e.target.value)}
                    placeholder="Plaque (ex: AB-123-CD)"
                    className="w-full bg-safe-card border border-safe-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-safe-red transition-colors font-mono" 
                  />
                </div>
              </div>
            </section>

            <div className="pt-6 pb-8 border-t border-safe-border">
              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-safe-red text-white py-4 md:py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-safe-red-hover hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(229,57,53,0.3)] disabled:shadow-none disabled:hover:scale-100"
              >
                {loading ? <div className="animate-spin w-6 h-6 border-2 border-white border-t-white/30 rounded-full" /> : (
                  <>
                    <Save size={24} />
                    SAUVEGARDER LES MODIFICATIONS
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
