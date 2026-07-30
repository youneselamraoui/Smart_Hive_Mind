# Smart Hive Mind — Design System

## Fichiers de thème

| Fichier | Rôle |
|---------|------|
| `src/theme-tokens.css` | Toutes les variables CSS de design tokens (couleurs, typo, espacement, ombres, etc.) + thème sombre |
| `src/styles.css` | Reset CSS, styles globaux de composants (empty-state, utilitaires, accessibilité). **Ne contient plus de variables** |
| `src/app/app.config.ts` | Preset PrimeNG (`SHMpreset`) — surcharges de composants PrimeNG pour coller au thème |

## Palette primaire — Indigo

```css
--indigo-50:  #EEEDFF   /* fond très clair, hover de table */
--indigo-100: #D0CEFF   /* fond de tag/section */
--indigo-200: #A9A5FF   /* bordure légère */
--indigo-300: #7C77FF   /* icône, lien hover en dark */
--indigo-400: #6360F0   /* accent sidebar */
--indigo-500: #5B4FE0   /* **couleur principale** — boutons, liens, focus */
--indigo-600: #4C40CD   /* hover bouton */
--indigo-700: #3D33A8   /* hover lien light */
--indigo-800: #2F2783   /* texte foncé */
--indigo-900: #201B5E   /* fond très foncé */
--indigo-950: #120F3A
```

## Couleurs sémantiques

Chaque couleur a des nuances 50-700 pour fond, bordure, texte, icône.

- **`--success-*`** (vert) — validation, certification, confirmation
- **`--warning-*`** (ambre) — attention, modération, brouillon
- **`--error-*`** (rouge) — erreur, refus, suppression
- **`--info-*`** (bleu) — information, aide, conseil

Utilisation recommandée dans les composants :

```css
background: var(--success-50);
border: 1px solid var(--success-200);
color: var(--success-700);
```

## Typographie

### Polices

```css
--font-heading: 'Fraunces', serif;     /* titres marketing (landing, hero) */
--font-body:    'IBM Plex Sans', sans-serif; /* interface applicative */
--font-mono:    'IBM Plex Mono', monospace;  /* code, hash, timestamps */
```

### Échelle — Interface applicative

| Token | Taille | Usage |
|-------|--------|-------|
| `--text-xs` | 0.70rem (11px) | Badges, timestamps, métriques |
| `--text-sm` | 0.80rem (13px) | Labels, légendes, textes secondaires |
| `--text-base` | 0.92rem (15px) | **Corps de texte par défaut** |
| `--text-lg` | 1.05rem (17px) | Texte large, descriptions |
| `--text-xl` | 1.25rem (20px) | Sous-titres, titres de carte |
| `--text-2xl` | 1.50rem (24px) | Titres de section, page |
| `--text-3xl` | 1.85rem (30px) | Titres de page principaux |

### Échelle — Marketing (landing page)

| Token | Taille | Usage |
|-------|--------|-------|
| `--text-feature` | 1.75rem (28px) | Titres de feature section |
| `--text-display` | 2.50rem (40px) | Grands titres de section |
| `--text-hero` | 3.25rem (52px) | Hero principal du landing |

Sur la landing page, utiliser `--font-heading` pour les titres. Dans l'application, laisser le reset global qui applique `--font-heading` aux balises `<h1>`–`<h6>`, ou utiliser `--font-body` pour les titres d'interface si nécessaire.

### Poids et graisses

```css
--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600; /* labels, boutons */
--font-weight-bold: 700;
```

### Line-height

```css
--leading-tight: 1.15;   /* titres */
--leading-snug: 1.35;    /* cartes, listes */
--leading-normal: 1.60;  /* corps (body) */
--leading-relaxed: 1.75; /* longs textes, articles */
```

## Espacement

Échelle en 4/8/12/16/24/32/48 px :

```css
--space-1: 4px;   /* micro-gap */
--space-2: 8px;   /* petit gap entre éléments proches */
--space-3: 12px;  /* gap standard entre champs */
--space-4: 16px;  /* padding interne des cartes */
--space-5: 24px;  /* padding de section */
--space-6: 32px;  /* grand espacement entre sections */
--space-7: 48px;  /* page padding, hero spacing */
```

### Classes utilitaires disponibles

```css
.gap-1 à .gap-7   /* gap */
.p-1 à .p-5       /* padding */
.px-2 à .px-5     /* padding horizontal */
.py-2 à .py-4     /* padding vertical */
.mx-auto           /* centrage horizontal */
```

## Rayons de bordure

```css
--radius-sm:   4px;   /* inputs, petits éléments */
--radius-md:   8px;   /* **valeur par défaut** — boutons, cartes (via PrimeNG) */
--radius-lg:   12px;  /* modales, dialogs */
--radius-xl:   16px;  /* grandes cartes */
--radius-full: 9999px; /* badges, avatars, toggles */
```

## Ombres

```css
--shadow-xs   /* micro-ombre, éléments non interactifs */
--shadow-sm   /* ombre de carte standard (--shadow-card) */
--shadow-md   /* dropdown, popover */
--shadow-lg   /* modal, sidebar */
--shadow-xl   /* toast, notification flottante */
```

## Mode sombre

Le toggle dans le header (`<app-theme-toggle>`) bascule l'attribut `data-theme="dark"` sur `<html>`.

Pour tester un composant en mode sombre pendant le développement :

```html
<html data-theme="dark">
```

Le preset PrimeNG utilise `darkModeSelector: '[data-theme="dark"]'` pour synchroniser ses couleurs avec le thème CSS.

## Composants PrimeNG — Preset (`app.config.ts`)

Les composants suivants ont des surcharges de style dans `SHMpreset` :

| Composant | Éléments stylés |
|-----------|----------------|
| Button | root, text, outlined — `borderRadius: 8px` |
| InputText / Textarea | border, focus ring — `borderRadius: 8px` |
| InputNumber / Password / Select | border radius |
| Checkbox / RadioButton | border width |
| InputSwitch | border radius full |
| Card | border radius + shadow + border |
| Panel | border radius |
| DataTable | header background, row hover |
| Dialog / ConfirmDialog | border radius + shadow |
| Toast | border radius |
| Message | border radius |
| Tabs | tab active border/color |
| Tag / Chip / Badge | border radius + font |
| Divider | border color |
| Tooltip | border radius + font size |
| ProgressBar | border radius + height |
| Paginator | root + page button hover |

Pour ajouter un nouveau composant : étendre l'objet `SHMpreset > components` dans `app.config.ts`.

## Bonnes pratiques

1. **Toujours utiliser les variables CSS** (`var(--indigo-500)`) plutôt que des couleurs en dur
2. **Utiliser les alias sémantiques** (`--color-surface`, `--color-text-secondary`) plutôt que les tokens de palette directement, pour que le dark mode fonctionne automatiquement
3. **Pour les composants PrimeNG**, modifier le preset dans `app.config.ts` plutôt que de faire des overrides CSS globaux
4. **Éviter les `!important`** — utiliser la spécificité CSS naturelle
5. **Responsive** : les breakpoints ne sont pas dans les tokens — utiliser les media queries standard dans les composants
6. **Dark mode** : tester systématiquement les deux thèmes. Si un composant utilise une couleur de palette directement (ex: `var(--indigo-100)`), ajouter aussi la valeur dark dans `theme-tokens.css`
