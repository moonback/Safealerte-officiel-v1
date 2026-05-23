# Roadmap Safe Alert V1 : De Prototype à Production (Supabase)

L'objectif de cette roadmap est de transformer le prototype actuel de **Safe Alert** en une application prête pour la production, sécurisée, en temps réel et backée par **Supabase** (PostgreSQL, Auth, Storage, Realtime).

---

## 🏗️ Phase 1 : Infrastructure & Base de données (Supabase)
Mise en place de l'environnement backend et conception du schéma de base de données.

- [ ] **Création du projet Supabase** : Initialisation des clés API (URL, Anon Key) dans `.env`.
- [ ] **Modélisation de la base de données (PostgreSQL)** :
  - `users` : id (auth), nom, email, rôle (citoyen, admin, membre_equipe), avatar.
  - `alerts` : id, type, nom_victime, infos (âge, taille...), description, vehicule, statut, niveau_danger, localisation (PostGIS), date_disparition.
  - `reports` : id, alert_id, type_signalement, localisation, description, user_id.
  - `teams` : id, nom, statut, localisation.
  - `team_members` : relation users / teams.
  - `messages` : id, team_id, user_id, contenu, media_url, timestamp.
- [ ] **Sécurité (RLS - Row Level Security)** :
  - Restreindre la création d'alertes aux `admins`.
  - Permettre la lecture des alertes à tous (`public`).
  - Restreindre l'accès au chat des équipes uniquement aux membres de l'équipe concernée.
- [ ] **Configuration Supabase Storage** :
  - Bucket `avatars` : Photos de profil.
  - Bucket `alerts` : Photos des personnes signalées disparues.
  - Bucket `reports_media` : Preuves (photos/vidéos) uploadées lors des signalements citoyens.

---

## 🔐 Phase 2 : Authentification & Profils
Remplacement des mockups d'onboarding par Auth Supabase.

- [ ] **Intégration de @supabase/supabase-js** dans le frontend web/mobile.
- [ ] **Configuration SSO (Single Sign-On)** : Activation Apple et Google Auth via le dashboard Supabase.
- [ ] **Écran Onboarding / Login** :
  - Câbler l'inscription/connexion Email & Mot de passe.
  - Câbler les boutons Google et Apple.
- [ ] **Gestion des sessions** :
  - Mémorisation de l'état utilisateur (Connecté/Déconnecté).
  - Redirection automatique (Auth Guard) vers `/home` ou `/admin` selon le rôle de l'utilisateur.
- [ ] **Écran Profil** : Connecter l'update du profil et la déconnexion (`supabase.auth.signOut()`).

---

## 📡 Phase 3 : Remplacement des Mocks (Alertes & Signalements)
Connexion des écrans principaux (Home, Alert Detail, Report) aux vraies données.

- [x] **Accueil (Home) & Carte** :
  - `GET /alerts` : Fetcher les alertes `EN COURS` depuis Supabase.
  - Remplacer les markers mockés sur la carte par des latitudes/longitudes réelles tirées de Supabase (ou PostGIS).
- [x] **Flux de Signalement (Report Stepper)** :
  - Gérer l'upload d'images vers Supabase Storage (Étape 3). Support multi-médias (photos/vidéos).
  - Ajout de champs pertinents (tenue, direction de fuite) encapsulés dans la payload.
  - `POST /reports` : Insérer la ligne avec l'ID utilisateur, coordonnées GPS et URL de l'image.
- [x] **Détail de l'Alerte** : Dynamiser complètement l'écran en piochant les données réelles.

---

## ⚡ Phase 4 : Temps Réel (Supabase Realtime)
C'est ici que l'application prend vie lors des situations d'urgence.

- [x] **Chat des Équipes (`TeamsScreen`)** :
  - Fetcher l'historique des messages.
  - Souscrire aux nouveaux messages via **Supabase Realtime Channels** (`postgres_changes` sur la table `messages`).
  - Envoi de messages texte et upload d'images.
- [x] **Fil d'actualité en direct (`AdminDashboardScreen`)** : 
  - Mettre à jour automatiquement le journal d'activité quand un citoyen fait un signalement.
- [ ] **Géolocalisation des équipes (Bonus)** :
  - Mettre à jour en temps réel la position des équipes sur la carte pour l'Admin via l'API _Broadcast_ de Supabase.

---

## 🛡️ Phase 5 : Dashboard Admin & Back-Office
Permettre aux autorités de gérer la crise.

- [x] **Gestion des Alertes** : Création d'un formulaire sécurisé pour lancer ou clôturer une Alerte Disparition (upload de photo, ajout du véhicule suspect).
  - Formulaire amélioré : ajout d'une date et heure de disparition.
  - UI structurée par grandes zones (Infos, Photo, Détails opérationnels).
  - Adapté à l'écran admin avec le layout et la barre latérale.
  - Outil de pointage cartographique manuel (latitude/longitude custom).
  - Détail véhicule structuré par champs (Marque, Modèle, Plaque, Couleur).
  - Nouveaux types de disparition gérés (Personne Vulnérable, Fugue).
  - UI de création enrichie pour inclure la description physique complète de la victime (Couleur des yeux, Cheveux, Poids, Tenue).
- [x] **Tri et visualisation des signalements** : Connecter la liste des signalements affichés sur les cartes aux données réelles postées par les citoyens.
  - Affichage complet des rapports de signalements liés sur la page détaillée de l'alerte.
  - Formulaire de signalement mis à jour pour transmettre `alertId` depuis l'interface détaillée.
- [x] **Statistiques (Dashboard)** : Requêter le comptage total des alertes, signalements non lus, équipes actives depuis la bdd.
- [x] **Équipes** : Afficher et sélectionner les dispositifs de recherche disponibles sur le terrain.

---

## 🔔 Phase 6 : Notifications Push & Services Locaux
Avertir les utilisateurs rapidement.

- [ ] **Expo Notifications / PWA Push** :
  - Configurer les permissions utilisateurs dans l'App/Navigateur.
  - Stocker les `push_tokens` dans la table `users`.
- [ ] **Edge Functions (Supabase)** : 
  - Créer une fonction déclenchée lors de l'insertion d'une nouvelle `Alerte`.
  - La fonction envoie une notification Push Firebase (FCM) ou APNs aux téléphones enregistrés dans la zone géolocalisée concernée.
- [ ] **Intégration Maps native** : Passer des placeholders actuels à une vraie implémentation (Leaflet pour PWA web avec Mapbox/OpenStreetMap style Dark, ou `react-native-maps` si compilation via Expo Go).

---

## 🚦 Phase 7 : Déploiement & Sécurité Finale
- [ ] Revue des polices de sécurité Supabase (vérifier qu'un utilisateur standard ne peut pas modifier une alerte).
- [ ] Tests de charge (Comment le système réagit s'il y a 10,000 connexions au moment d'une notification).
- [x] Nettoyage des composants mock (supprimer `mock.ts`).
- [ ] Build de production CI/CD (Vite PWA, Docker, ou EAS Build pour mobile natif).
