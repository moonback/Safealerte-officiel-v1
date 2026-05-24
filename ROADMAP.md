# Roadmap SafeAlert – Vers une efficacité supérieure aux solutions gouvernementales 🚀

## Vision
Offrir une plateforme d'alerte de disparition ultra‑rapide, sécurisée et intelligente, capable de détecter, notifier et coordonner les réponses en temps réel, surpassant les systèmes gouvernementaux classiques en temps de réaction, précision et expérience utilisateur.

## Objectifs clés (2026‑2027)
- **Temps de détection ≤ 2 s** grâce à l’optimisation du traitement d’image et du géocodage. 
- **Notification géo‑ciblée < 5 s** via push FCM/Expo. 
- **Coordination d’équipes en temps réel** avec visualisation des zones de recherche et suivi GPS.
- **Conformité RGPD** assurant la protection des données citoyennes.

---

## Phase 1 – Analyse & Baseline (0‑1 mois)
- **Audit du code** : parcourir `src/` (components, hooks, contexts) pour cartographier l’architecture actuelle.
- **Inventaire des fonctionnalités** : synthétiser les éléments du MVP décrits dans l’actuel `ROADMAP.md`.
- **Profilage de performance** : mesurer latence du rendu Leaflet, synchronisation Supabase et téléchargement d’images.
- **Sécurité** : vérifier les règles Supabase, les permissions de stockage et les politiques de conservation.
- **Benchmark concurrent** : recenser les spécifications publiques du système d’« alert enlevement du gouvernement » afin d’identifier les écarts de performance et d’expérience.

---

## Phase 2 – Améliorations stratégiques (1‑4 mois)
| Domaine | Cible | Raison |
|---|---|---|
| **Auth & Identité** | Supabase Auth + SSO + 2FA | Fiabilité et confiance des utilisateurs |
| **Push Géolocalisé** | FCM/Expo + Edge‑function déclenchée à 50 km | Alertes instantanées hors applicative |
| **Gestion d’équipes** | Polygones de recherche, suivi GPS en temps réel | Coordination plus rapide des interventions |
| **IA Analyse d’images** | Azure Vision / OpenAI CLIP (plaques, visages) | Automatisation de la validation des preuves |
| **Application native** | Expo React‑Native wrapper | Accès aux capteurs natifs, GPS en arrière‑plan |
| **Mode Offline** | WatermelonDB ↔ Supabase sync | Opération dans zones sans couverture réseau |
| **Performance UI** | Lazy‑load tiles, WebGL canvas, compression client‑side | Réduction bande passante, UI fluide |
| **Observabilité** | Sentry + tableau de bord Supabase métriques | Détection précoce des ralentissements/crash |
| **Conformité** | Workflow consentement, purge données | Alignement législatif |

---

## Phase 3 – Déploiement & Croissance (4‑12 mois)
1. **V1 (3 mois)** – Auth complète, notifications géo‑ciblées, gestion d’équipes, IA tagging basique. 
2. **V2 (6 mois)** – Application mobile native, IA clustering avancée, synchronisation offline, analytics admin. 
3. **V3 (12 mois)** – Intégration API services d’urgence nationaux, support multilingue, déploiement à l’échelle nationale.

## Métriques de succès
- **Temps moyen de notification** < 5 s. 
- **Taux de résolution** > 80 % des alertes en < 30 min. 
- **Latence UI** < 200 ms pour le rendu carte. 
- **NPS** 70 auprès des citoyens et des équipes admin.

---

## Avantage compétitif
En combinant IA d’analyse d’image, push géo‑ciblé et mode offline, SafeAlert réduit le temps de réaction de plusieurs minutes à quelques secondes, surpassant les solutions gouvernementales limitées à des notifications génériques et à une dépendance réseau totale.

## Prochaines étapes immédiates
- Valider les réponses aux questions ouvertes (benchmark, métriques, contraintes). 
- Lancer l’audit du code (grep/tree) et établir le backlog initial.
- Prioriser les tickets GitHub selon les catégories ci‑dessus.

*Roadmap mise à jour le 24 mai 2026*
