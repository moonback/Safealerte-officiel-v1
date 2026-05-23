# Schéma de la Base de Données

Ce document décrit la structure de la base de données PostgreSQL gérée par Supabase pour le projet Safe Alert.

## 🗄️ Tables Principales

### 1. `users` (Utilisateurs & Profils)
Étend la table `auth.users` interne de Supabase.
- `id` (UUID, Primary Key) : Référence vers `auth.users(id)`.
- `name` (TEXT) : Nom complet de l'utilisateur.
- `email` (TEXT) : Email (Unique).
- `role` (ENUM: `citoyen`, `admin`, `membre_equipe`) : Rôle déterminant les permissions.
- `avatar_url` (TEXT) : Lien vers la photo de profil.
- `created_at` (TIMESTAMPTZ) : Date d'inscription.

### 2. `alerts` (Alertes Disparitions)
Contient les informations critiques sur une disparition.
- `id` (UUID, Primary Key)
- `type` (TEXT) : Type d'alerte (ex: Enlèvement, Disparition).
- `victim_name` (TEXT) : Nom de la personne disparue.
- `age` (INTEGER) : Âge.
- `height` (TEXT) : Taille approximative.
- `description` (TEXT) : Description physique détaillée.
- `suspect_vehicle` (TEXT) : Informations sur le véhicule suspect (si applicable).
- `status` (ENUM: `EN COURS`, `RESOLUE`, `ANNULEE`)
- `danger_level` (ENUM: `FAIBLE`, `MOYEN`, `ÉLEVÉ`, `TRÈS ÉLEVÉ`)
- `location` (TEXT) : Lieu de la disparition (format texte).
- `latitude` / `longitude` (DOUBLE PRECISION) : Coordonnées GPS exactes.
- `missing_since` (TIMESTAMPTZ) : Date et heure de la disparition.
- `created_by` (UUID) : Référence vers l'Admin ayant créé l'alerte.

### 3. `reports` (Signalements Citoyens)
Informations remontées par les utilisateurs.
- `id` (UUID, Primary Key)
- `alert_id` (UUID) : Lien vers la table `alerts`.
- `report_type` (TEXT) : Type d'information (ex: Vu récemment, Info véhicule).
- `description` (TEXT) : Détails fournis par le citoyen.
- `location` (TEXT) : Lieu du signalement (texte).
- `latitude` / `longitude` (DOUBLE PRECISION) : Coordonnées GPS exactes (crucial pour la carte).
- `user_id` (UUID) : Utilisateur ayant fait le signalement.
- `created_at` (TIMESTAMPTZ)

### 4. `teams` (Équipes de recherche)
Groupes opérationnels sur le terrain.
- `id` (UUID, Primary Key)
- `name` (TEXT) : Nom de l'équipe (ex: Equipe Alpha).
- `status` (TEXT) : État (Déployé, En attente).
- `location` (TEXT) : Zone de recherche.

### 5. `team_members` (Membres d'équipes)
Table de jonction (Many-to-Many) entre `users` et `teams`.
- `team_id` (UUID)
- `user_id` (UUID)
- `is_leader` (BOOLEAN) : Indique le chef d'équipe.
- `joined_at` (TIMESTAMPTZ)

### 6. `messages` (Chat opérationnel)
Communications en temps réel des équipes.
- `id` (UUID, Primary Key)
- `team_id` (UUID) : Équipe concernée.
- `user_id` (UUID) : Auteur du message.
- `content` (TEXT) : Contenu texte.
- `media_url` (TEXT) : Image ou fichier attaché.
- `created_at` (TIMESTAMPTZ)

---

## 🔒 Sécurité (Row Level Security - RLS)

La base de données applique des règles strictes au niveau des lignes (RLS) :

1. **Alertes** : Tout le monde peut *lire* (SELECT) les alertes. Seuls les profils ayant `role = 'admin'` peuvent *créer* ou *modifier* des alertes.
2. **Signalements** : Un citoyen (authentifié) peut *insérer* un signalement. Il ne peut *lire* que ses propres signalements. Les `admins` peuvent lire tous les signalements.
3. **Messages (Chat)** : Un message ne peut être lu et envoyé que par un membre de l'équipe associée, ou par un admin supervisant les opérations.
