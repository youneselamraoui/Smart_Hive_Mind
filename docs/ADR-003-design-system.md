# ADR-003 : Design system frontend — approche hybride PrimeNG + composants custom

| Champ | Valeur |
|-------|--------|
| **Statut** | Accepté |
| **Date** | Juillet 2026 |
| **Décideur** | Équipe de développement |
| **Références** | Cahier des charges §5.2, §5.4, `frontend/package.json`, `frontend/src/app/app.config.ts` |

---

## Contexte

Le cahier des charges (section 5.2) spécifie **PrimeNG** comme bibliothèque de composants
pour le frontend Angular. L'état réel du code est une **approche hybride** :

- **PrimeNG (v21.1.9)** est installé et activement configuré : un preset maison
  (`SHMpreset` dans `frontend/src/app/app.config.ts`) stylise 22 composants standards
  (button, inputtext, textarea, inputnumber, password, select, checkbox, radiobutton,
  inputswitch, card, panel, datatable, dialog, confirmdialog, toast, message, tabs, tag,
  chip, badge, divider, tooltip, progressbar, paginator) avec un support **clair/sombre
  natif** (`darkModeSelector: '[data-theme="dark"]'`).
- **Composants custom** couvrent les besoins spécifiques au projet sans équivalent
  PrimeNG pertinent : `HexSealComponent` (sceau blockchain), `NotificationBellComponent`,
  `ContentCardComponent`, `EmptyStateComponent`, `PaginatorComponent`,
  `RichEditorComponent`, `ThemeToggleComponent`, `ConfirmDialogComponent` (78 fichiers
  `.component.ts` au total dans `frontend/src/app`).

---

## Décision

**L'approche hybride est confirmée et documentée comme état de référence du design
system**, sans modification de code :

| Couche | Rôle | Exemples |
|--------|------|----------|
| **PrimeNG** (via `SHMpreset`) | Composants d'interface génériques : formulaires, tables, dialogues, notifications, onglets | `ChartModule`, `SkeletonModule`, `RatingModule`, `Textarea`, `Button`, `MessageService` |
| **Composants custom** | Éléments de branding et de métier spécifiques à Smart Hive Mind, sans équivalent générique pertinent | `HexSealComponent`, `NotificationBellComponent`, `ContentCardComponent`, `ThemeToggleComponent` |

---

## Justification / Raisons

### 1. PrimeNG couvre les composants d'interface génériques

La majorité des besoins d'interface (saisie, tableaux, modales, toasts, pagination,
indicateurs) est standard et parfaitement couverte par PrimeNG. Le preset `SHMpreset`
centralise le style de ces composants en un seul endroit (`app.config.ts`), avec un
support clair/sombre natif via les tokens de thème.

### 2. Le custom couvre les éléments de branding et de métier

Certains éléments sont propres à Smart Hive Mind et n'ont pas d'équivalent pertinent
dans PrimeNG :

- **HexSealComponent** : sceau visuel blockchain, spécifique au produit
- **NotificationBellComponent** : cloche de notification intégrée au layout
- **ContentCardComponent** : carte de contenu avec habillage métier
- **RichEditorComponent** : éditeur enrichi avec les besoins éditoriaux du projet

### 3. Aucune régression à ce stade

Les deux couches coexistent déjà, sont fonctionnelles et testées. Une migration
complète vers PrimeNG, ou un retrait de PrimeNG au profit du custom, présenterait un
risque de régression sans bénéfice fonctionnel identifié.

---

## Conséquences

| Document / Point | Action |
|------------------|--------|
| **Cahier des charges §5.2** | Doit être précisé : PrimeNG comme bibliothèque de composants génériques, complétée par des composants custom pour le branding et les besoins métier — plutôt qu'un choix binaire PrimeNG vs custom |
| **Cahier des charges §5.4** (thème) | Doit refléter la répartition : thème clair/sombre géré via les tokens du preset PrimeNG pour les composants standards, et via CSS custom pour les composants maison |

### Ce qui reste valable

- **Les composants custom existants** : inchangés, aucune migration prévue.
- **La configuration PrimeNG** : inchangée, `SHMpreset` reste la source unique de
  style pour les composants PrimeNG.

---

## Risques

| Risque | Probabilité | Impact | Atténuation |
|--------|------------|--------|-------------|
| Aucun risque spécifique identifié | — | — | L'architecture est déjà stable et fonctionnelle ; les deux couches coexistent sans conflit de style (tokens PrimeNG pour le générique, CSS custom pour le métier). |

---

## Pistes futures

Aucune piste particulière à ce stade : l'architecture du design system est stable.
Si le cahier des charges §5.2/5.4 devait être réinterprété (migration complète vers
PrimeNG ou retrait total), une nouvelle ADR serait nécessaire — non anticipée dans
l'état actuel du projet.

---

## Références

- [frontend/package.json](../frontend/package.json) — dépendances `primeng` v21.1.9 et `primeicons` v7.0.0
- [frontend/src/app/app.config.ts](../frontend/src/app/app.config.ts) — preset `SHMpreset`, `providePrimeNG`, support clair/sombre
- Composants custom : `frontend/src/app/core/` (ContentCard, EmptyState, Paginator, RichEditor, HexSeal, ThemeToggle, NotificationBell, ConfirmDialog, Toast)
- Cahier des charges §5.2, §5.4 (document externe) — sections à préciser
