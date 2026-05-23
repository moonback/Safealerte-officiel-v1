# Documentation de l'API (Supabase)

Safe Alert utilise l'API REST auto-générée de **Supabase** (basée sur PostgREST). Toutes les requêtes HTTP classiques sont gérées via le client `@supabase/supabase-js` dans l'application.

## 🔐 Authentification (`supabase.auth`)

Gère la connexion, l'inscription et la gestion de session.

- **S'inscrire (Email/Mot de passe)**
  ```javascript
  const { data, error } = await supabase.auth.signUp({
    email: 'user@example.com',
    password: 'password123',
    options: { data: { full_name: 'John Doe' } }
  })
  ```
- **Se connecter**
  ```javascript
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  ```
- **Se déconnecter**
  ```javascript
  await supabase.auth.signOut()
  ```

---

## 🚨 Alertes (`public.alerts`)

- **Récupérer toutes les alertes** (Public)
  ```javascript
  const { data: alerts, error } = await supabase
    .from('alerts')
    .select('*')
    .order('created_at', { ascending: false });
  ```
- **Récupérer une alerte spécifique** (Public)
  ```javascript
  const { data, error } = await supabase.from('alerts').select('*').eq('id', alertId).single();
  ```
- **Créer une alerte** (Requiert Rôle Admin)
  ```javascript
  const { data, error } = await supabase.from('alerts').insert([{
    type: 'child_abduction',
    victim_name: 'Jane Doe',
    age: 8,
    status: 'EN COURS',
    danger_level: 'CRITIQUE',
    location: 'Paris, France',
    latitude: 48.8566,
    longitude: 2.3522
  }]);
  ```

---

## 👁️ Signalements (`public.reports`)

- **Créer un signalement** (Requiert Auth)
  ```javascript
  const { data, error } = await supabase.from('reports').insert([{
    alert_id: 'uuid-de-l-alerte',
    report_type: 'VU_RECEMMENT',
    description: 'Aperçue près de la gare',
    location: 'Gare de Lyon',
    latitude: 48.8443,
    longitude: 2.3744
  }]);
  ```
- **Récupérer les signalements d'une alerte**
  ```javascript
  const { data, error } = await supabase
    .from('reports')
    .select('*, profiles:user_id(name)')
    .eq('alert_id', alertId);
  ```

---

## 👥 Équipes & Messages (`public.teams`, `public.messages`)

- **Récupérer les équipes disponibles**
  ```javascript
  const { data, error } = await supabase.from('teams').select('*');
  ```
- **Envoyer un message dans le chat d'équipe**
  ```javascript
  const { data, error } = await supabase.from('messages').insert([{
    team_id: 'uuid-de-l-equipe',
    user_id: 'uuid-de-l-utilisateur',
    content: 'Nous fouillons le secteur Nord.'
  }]);
  ```

---

## 📡 Temps Réel (WebSockets)

Pour écouter les changements dans la base de données en direct :

```javascript
const channel = supabase
  .channel('public:reports')
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'reports' },
    (payload) => {
      console.log('Nouveau signalement reçu en temps réel !', payload);
      // Mettre à jour l'UI...
    }
  )
  .subscribe();
```

---

## 🗂️ Storage (Fichiers & Médias)

- **Uploader une image de signalement**
  ```javascript
  const { data, error } = await supabase.storage
    .from('reports_media')
    .upload(`public/${Date.now()}_image.png`, fileData);
  ```
- **Récupérer l'URL publique d'une image d'alerte**
  ```javascript
  const { data } = supabase.storage
    .from('alerts')
    .getPublicUrl('path/to/image.jpg');
  ```
