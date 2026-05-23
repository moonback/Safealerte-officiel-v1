# Guide de Contribution 🤝

Merci de l'intérêt que vous portez au projet **Safe Alert**. Toute contribution (corrections de bugs, nouvelles fonctionnalités, documentation) est la bienvenue.

Ce document explique comment contribuer proprement au projet.

## 🛠️ Processus de Développement

1. **Forker le dépôt**
   Commencez par forker le dépôt officiel vers votre propre compte GitHub.

2. **Créer une branche dédiée**
   Ne travaillez jamais directement sur `main`. Créez une branche avec une convention de nommage claire :
   - Pour une nouvelle fonctionnalité : `feature/nom-de-la-feature`
   - Pour une correction de bug : `fix/description-du-bug`
   - Pour de la documentation : `docs/sujet-modifie`
   - Pour du refactoring : `refactor/composant-modifie`

   ```bash
   git checkout -b feature/ma-nouvelle-feature
   ```

3. **Développer**
   - Assurez-vous de suivre les conventions de code (voir ci-dessous).
   - Lancez le serveur local (`npm run dev`) pour tester vos changements.
   - Vérifiez que le typage TypeScript est correct en lançant `npm run lint` (qui exécute `tsc --noEmit`).

4. **Commiter vos changements**
   Nous utilisons la convention **Conventional Commits** :
   - `feat: ajoute la fonctionnalité X`
   - `fix: corrige le problème Y sur l'écran Z`
   - `docs: met à jour le README`
   - `style: formate le code (aucun changement logique)`
   
   Rédigez des messages clairs et concis.

5. **Pousser et Créer une Pull Request (PR)**
   ```bash
   git push origin feature/ma-nouvelle-feature
   ```
   Ouvrez une Pull Request sur le dépôt principal. Fournissez une description détaillée du changement, incluez des captures d'écran si vous avez modifié l'UI, et liez la PR à une Issue existante si applicable.

## 📐 Conventions de Code

- **TypeScript** : Privilégiez le typage strict. N'utilisez `any` qu'en dernier recours. Définissez vos interfaces dans les fichiers ou dans un dossier `/types`.
- **Composants React** :
  - Utilisez les composants fonctionnels (Functional Components) et les Hooks.
  - Nommez les composants en PascalCase (ex: `AdminDashboardScreen.tsx`).
  - Gardez vos composants petits et réutilisables. Découpez les gros fichiers complexes.
- **Styling** :
  - Utilisez **Tailwind CSS**. Évitez d'écrire du CSS brut sauf cas de force majeure (dans `index.css`).
  - Regroupez les classes logiquement (ex: Layout > Spacing > Typography > Colors).
- **Variables d'Environnement** :
  - Si votre feature nécessite une nouvelle variable d'environnement, ajoutez-la au fichier `.env.example`. N'ajoutez jamais de clés secrètes réelles dans le code.

## 🐛 Signaler un Bug

Si vous trouvez un bug mais ne savez pas comment le corriger :
1. Vérifiez dans les **Issues** de GitHub si le problème n'a pas déjà été signalé.
2. Ouvrez une nouvelle Issue.
3. Décrivez le bug précisément (OS, Navigateur, Étapes pour reproduire).
4. Ajoutez des captures d'écran ou logs si pertinent.

Merci pour votre aide ! 🚨
