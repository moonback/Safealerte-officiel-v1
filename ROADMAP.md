# Roadmap Safe Alert 🚀

Cette roadmap détaille le cheminement de l'application Safe Alert, de son statut actuel de MVP (Minimum Viable Product) robuste jusqu'aux futures itérations prévues en production.

---

## ✅ Objectifs Complétés (MVP Actuel)

- **Infrastructure de base** : Configuration de Supabase (PostgreSQL, Auth, Storage).
- **Interface Utilisateur Adaptative** : Responsive design avec redirection "Mobile-First" pour les citoyens et "Desktop-First" pour l'Admin.
- **Cartographie Interactive** : Intégration de Leaflet avec cartes satellites, marqueurs de géolocalisation, et recherche d'adresses (Nominatim).
- **Gestion des Alertes (Admin)** : Création, modification et clôture des alertes disparitions. Visualisation en temps réel sur une carte.
- **Flux de Signalement (Citoyen)** : Processus en 3 étapes permettant à un témoin de remonter une géolocalisation précise et une photo d'indice.
- **Synchronisation Temps Réel** : Mise à jour du flux d'activités et de la carte admin sans rafraîchissement via Supabase Realtime.

---

## 🏗️ Prochaines Étapes (V1 : Lancement Production)

### 1. Authentification Complète & Profils
- Déployer l'authentification Supabase (Email/Mot de passe, et SSO Google/Apple) pour remplacer la couche simulée (`AuthContext` actuel).
- Permettre aux citoyens de configurer des zones de vigilance dans leur profil (ex: "Prévenez-moi si une alerte est déclenchée près de mon domicile").

### 2. Notifications Push Géolocalisées
- Intégrer les notifications Push (via Firebase Cloud Messaging ou Expo Push Services).
- Implémenter une Edge Function Supabase déclenchée lors de la création d'une alerte, qui notifie uniquement les téléphones présents dans un rayon de 50km autour du lieu de disparition.

### 3. Gestion Avancée des Équipes (Teams)
- Permettre à l'Admin d'assigner des zones de recherche précises (dessin de polygones sur la carte) à des équipes spécifiques.
- Afficher la géolocalisation en temps réel des chefs d'équipe sur la carte de l'Admin via l'API Supabase Broadcast.

---

## 🔮 Vision à Long Terme (V2+)

### 1. Intelligence Artificielle & Traitement d'Images
- Intégration d'une API d'analyse d'images pour analyser automatiquement les photos soumises dans les signalements citoyens (détection de visages, lecture de plaques d'immatriculation).
- Regroupement (Clustering) intelligent des signalements : L'IA détecte si plusieurs citoyens signalent la même voiture dans un secteur précis et remonte l'information en priorité à l'Admin.

### 2. Application Mobile Native
- Migration partielle ou encapsulage de la PWA React dans React Native (via Expo) pour accéder plus profondément aux capteurs natifs du téléphone (GPS en arrière-plan, Camera native).

### 3. Connectivité Autonome (Offline Mode)
- Intégration d'une base de données locale (comme WatermelonDB ou RxDB) pour permettre aux équipes de recherche d'utiliser le chat et la carte même dans des zones blanches (sans réseau), avec synchronisation automatique une fois le réseau retrouvé.
