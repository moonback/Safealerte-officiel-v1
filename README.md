# Safe Alert 🚨

Safe Alert est une application citoyenne et un tableau de bord d'administration en temps réel conçus pour accélérer et coordonner les recherches lors de disparitions inquiétantes (Enlèvement, Personne Vulnérable, etc.).

## 🛠️ Stack Technique

- **Frontend** : React 19, TypeScript, Vite
- **Styling** : Tailwind CSS v4, Framer Motion, Lucide React
- **Cartographie** : Leaflet, React-Leaflet, OpenStreetMap Nominatim
- **Backend as a Service (BaaS)** : Supabase
- **Base de données** : PostgreSQL (avec Row Level Security)
- **Temps Réel** : Supabase Realtime Channels
- **Stockage** : Supabase Storage (pour les photos et preuves)

## ✨ Fonctionnalités Principales (MVP)

- **Alerte en temps réel** : Notifications instantanées des disparitions.
- **Signalement Citoyen** : Flux guidé étape par étape pour remonter une information, une géolocalisation précise, et des preuves (photos).
- **Carte Interactive** : Visualisation en temps réel des alertes actives, des signalements et des positions GPS.
- **Tableau de Bord Admin** : Espace sécurisé pour les autorités permettant de lancer de nouvelles alertes, suivre les signalements sur une carte en direct, et gérer les équipes.
- **Chat Sécurisé** : Communication en temps réel pour les équipes de recherche déployées.

## 📋 Prérequis

- [Node.js](https://nodejs.org/) (version 18 ou supérieure recommandée)
- [npm](https://www.npmjs.com/)
- Un compte [Supabase](https://supabase.com/)

## 🚀 Installation & Configuration

1. **Cloner le projet**
   ```bash
   git clone https://github.com/votre-compte/Safealerte-officiel.git
   cd Safealerte-officiel
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configuration de la Base de Données (Supabase)**
   - Créez un nouveau projet sur Supabase.
   - Exécutez le script SQL contenu dans `supabase-schema-phase-1.sql` dans le SQL Editor de Supabase pour créer les tables, les types, et les politiques RLS.
   - Créez manuellement les 3 buckets dans Storage : `avatars` (Public), `alerts` (Public), `reports_media` (Private).

4. **Variables d'environnement**
   Copiez le fichier d'exemple et configurez vos clés :
   ```bash
   cp .env.example .env
   ```
   Remplissez `.env` avec vos informations Supabase :
   ```env
   VITE_SUPABASE_URL=votre_url_supabase
   VITE_SUPABASE_ANON_KEY=votre_cle_anon_supabase
   ```

## 💻 Lancement du projet

**Mode Développement :**
```bash
npm run dev
```
Le serveur sera lancé sur `http://localhost:3000`. L'interface s'adaptera automatiquement (vue mobile pour le grand public, tableau de bord desktop pour les administrateurs).

**Build pour la Production :**
```bash
npm run build
```

## 📁 Structure du Projet

```
/
├── public/                 # Assets statiques
├── src/
│   ├── components/         # Composants React réutilisables
│   ├── contexts/           # Contextes React (AuthContext)
│   ├── hooks/              # Custom hooks (useAlerts, etc.)
│   ├── lib/                # Configurations externes (Supabase client)
│   ├── screens/            # Vues/Pages de l'application (Admin, Home, Map, etc.)
│   ├── App.tsx             # Routing principal
│   └── main.tsx            # Point d'entrée de l'application
├── supabase-schema-phase-1.sql # Schéma de la base de données
├── package.json            # Dépendances et scripts
└── vite.config.ts          # Configuration Vite
```

## 🤝 Bonnes pratiques pour contribuer

1. Créez une branche pour chaque nouvelle fonctionnalité (`feature/nom-feature`) ou correction (`fix/nom-bug`).
2. Assurez-vous que le code respecte les types TypeScript et ne génère pas d'erreurs (`npm run lint`).
3. Consultez le fichier `CONTRIBUTING.md` pour les détails de notre workflow.
4. Soumettez une Pull Request avec une description claire de vos modifications.

## 📄 Licence

Ce projet est sous licence **MIT**. Vous êtes libre de l'utiliser, de le modifier et de le distribuer.
