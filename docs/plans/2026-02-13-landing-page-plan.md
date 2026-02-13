# Landing Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a bilingual (DE/EN) landing page for effeff using Astro + Tailwind CSS v4, deployable as a static site.

**Architecture:** Standalone Astro project in `landing/` directory. Uses Astro's built-in i18n routing for `/de/` and `/en/` paths. Tailwind v4 via Vite plugin (no `@astrojs/tailwind`). All text in JSON translation files. Components derive locale from URL via `Astro.url`.

**Tech Stack:** Astro 5.x, Tailwind CSS v4, TypeScript

---

### Task 1: Scaffold Astro project

**Files:**
- Create: `landing/package.json`
- Create: `landing/astro.config.mjs`
- Create: `landing/tsconfig.json`
- Create: `landing/src/styles/global.css`
- Create: `landing/.gitignore`

**Step 1: Create the landing directory and initialize Astro**

```bash
cd /Users/olivier/Versioncontrol/local/effeff
mkdir landing && cd landing
npm create astro@latest . -- --template minimal --no-install --typescript strict
```

If the interactive prompts block, create files manually instead.

**Step 2: Install dependencies**

```bash
cd /Users/olivier/Versioncontrol/local/effeff/landing
npm install
npm install tailwindcss @tailwindcss/vite
```

**Step 3: Configure Astro with i18n and Tailwind**

Replace `astro.config.mjs` with:

```javascript
// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  i18n: {
    locales: ["en", "de"],
    defaultLocale: "en",
    routing: {
      prefixDefaultLocale: true,
      redirectToDefaultLocale: true,
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
```

**Step 4: Create global CSS with Tailwind and theme tokens**

Create `src/styles/global.css`:

```css
@import "tailwindcss";

@theme {
  --color-primary: #2563eb;
  --color-primary-hover: #1d4ed8;
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
}
```

**Step 5: Add .gitignore**

Create `landing/.gitignore`:

```
node_modules/
dist/
.astro/
```

**Step 6: Verify the project builds**

```bash
cd /Users/olivier/Versioncontrol/local/effeff/landing
npm run build
```

Expected: Build succeeds (may warn about no pages yet).

**Step 7: Commit**

```bash
git add landing/
git commit -m "feat(landing): scaffold Astro project with Tailwind v4 and i18n"
```

---

### Task 2: Set up i18n translation system

**Files:**
- Create: `landing/src/i18n/ui.ts`
- Create: `landing/src/i18n/utils.ts`

**Step 1: Create translation strings**

Create `src/i18n/ui.ts`:

```typescript
export const languages = {
  en: "English",
  de: "Deutsch",
} as const;

export type Lang = keyof typeof languages;
export const defaultLang: Lang = "en";

export const ui = {
  en: {
    // Nav
    "nav.github": "GitHub",

    // Hero
    "hero.title": "Build forms. Self-hosted.",
    "hero.subtitle": "The open-source alternative to Typeform. Create beautiful forms, collect submissions, upload files — all on your own infrastructure.",
    "hero.cta_primary": "View on GitHub",
    "hero.cta_secondary": "Setup Guide",

    // Features
    "features.heading": "Everything you need",
    "features.dnd.title": "Drag & Drop Builder",
    "features.dnd.description": "Reorder questions, configure settings, and preview your form — all with an intuitive drag-and-drop interface.",
    "features.types.title": "14 Question Types",
    "features.types.description": "Text, email, multiple choice, rating, yes/no, file upload, date, phone, URL, and more.",
    "features.renderer.title": "Animated Forms",
    "features.renderer.description": "Full-screen, one-question-at-a-time experience with smooth animations and keyboard navigation.",
    "features.uploads.title": "File Uploads",
    "features.uploads.description": "S3-compatible storage via Garage. Upload files directly through form submissions.",
    "features.analytics.title": "Analytics",
    "features.analytics.description": "Track response counts, completion rates, and average duration for every form.",
    "features.selfhosted.title": "Self-Hosted",
    "features.selfhosted.description": "Run on your own infrastructure. Full data ownership, GDPR-compliant by design.",

    // Screenshots
    "screenshots.heading": "See it in action",

    // Tech
    "tech.heading": "Built with modern tools",
    "tech.tagline": "Five services, one",

    // CTA
    "cta.heading": "Ready to get started?",
    "cta.subtitle": "Deploy effeff in minutes with Docker Compose.",
    "cta.primary": "View on GitHub",
    "cta.secondary": "Read the Docs",

    // Footer
    "footer.built_by": "Built by",
    "footer.source": "Source Code",

    // SEO
    "seo.title": "effeff — Self-hosted form builder",
    "seo.description": "Create beautiful forms, collect submissions, upload files. Open-source Typeform alternative you can host yourself.",
  },
  de: {
    // Nav
    "nav.github": "GitHub",

    // Hero
    "hero.title": "Formulare erstellen. Selbst gehostet.",
    "hero.subtitle": "Die Open-Source-Alternative zu Typeform. Erstelle Formulare, sammle Einsendungen, lade Dateien hoch — alles auf deiner eigenen Infrastruktur.",
    "hero.cta_primary": "Auf GitHub ansehen",
    "hero.cta_secondary": "Setup-Anleitung",

    // Features
    "features.heading": "Alles was du brauchst",
    "features.dnd.title": "Drag & Drop Builder",
    "features.dnd.description": "Fragen per Drag & Drop anordnen, Einstellungen konfigurieren und das Formular live in der Vorschau sehen.",
    "features.types.title": "14 Fragetypen",
    "features.types.description": "Text, E-Mail, Multiple Choice, Bewertung, Ja/Nein, Datei-Upload, Datum, Telefon, URL und mehr.",
    "features.renderer.title": "Animierte Formulare",
    "features.renderer.description": "Vollbild-Ansicht, eine Frage nach der anderen, mit Animationen und Tastaturnavigation.",
    "features.uploads.title": "Datei-Uploads",
    "features.uploads.description": "S3-kompatibler Speicher via Garage. Dateien direkt per Formular hochladen.",
    "features.analytics.title": "Auswertungen",
    "features.analytics.description": "Antworten, Abschlussrate und durchschnittliche Dauer pro Formular im Blick.",
    "features.selfhosted.title": "Self-Hosted",
    "features.selfhosted.description": "Betreibe effeff auf deiner eigenen Infrastruktur. Volle Datenkontrolle, DSGVO-konform.",

    // Screenshots
    "screenshots.heading": "So sieht es aus",

    // Tech
    "tech.heading": "Gebaut mit modernen Tools",
    "tech.tagline": "Fünf Services, ein",

    // CTA
    "cta.heading": "Bereit loszulegen?",
    "cta.subtitle": "Starte effeff in Minuten mit Docker Compose.",
    "cta.primary": "Auf GitHub ansehen",
    "cta.secondary": "Dokumentation lesen",

    // Footer
    "footer.built_by": "Erstellt von",
    "footer.source": "Quellcode",

    // SEO
    "seo.title": "effeff — Selbst-gehosteter Formular-Builder",
    "seo.description": "Erstelle Formulare, sammle Einsendungen, lade Dateien hoch. Die Open-Source Typeform-Alternative zum Selbsthosten.",
  },
} as const;
```

**Step 2: Create i18n helper functions**

Create `src/i18n/utils.ts`:

```typescript
import { ui, defaultLang, type Lang } from "./ui";

export function getLangFromUrl(url: URL): Lang {
  const [, lang] = url.pathname.split("/");
  if (lang in ui) return lang as Lang;
  return defaultLang;
}

export function useTranslations(lang: Lang) {
  return function t(key: keyof (typeof ui)[typeof defaultLang]): string {
    return ui[lang][key] || ui[defaultLang][key];
  };
}

export function getAlternateLang(lang: Lang): Lang {
  return lang === "en" ? "de" : "en";
}
```

**Step 3: Verify build**

```bash
cd /Users/olivier/Versioncontrol/local/effeff/landing
npm run build
```

Expected: Build succeeds.

**Step 4: Commit**

```bash
git add landing/src/i18n/
git commit -m "feat(landing): add i18n translation system with DE/EN strings"
```

---

### Task 3: Create BaseLayout and page routing

**Files:**
- Create: `landing/src/layouts/BaseLayout.astro`
- Create: `landing/src/pages/index.astro`
- Create: `landing/src/pages/en/index.astro`
- Create: `landing/src/pages/de/index.astro`

**Step 1: Create BaseLayout**

Create `src/layouts/BaseLayout.astro`:

```astro
---
import "../styles/global.css";
import { getLangFromUrl, useTranslations } from "../i18n/utils";
import { languages, type Lang } from "../i18n/ui";

const lang = getLangFromUrl(Astro.url);
const t = useTranslations(lang);
const alternateLang = lang === "en" ? "de" : "en";
---

<!doctype html>
<html lang={lang}>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{t("seo.title")}</title>
    <meta name="description" content={t("seo.description")} />
    <link rel="alternate" hreflang="en" href="/en/" />
    <link rel="alternate" hreflang="de" href="/de/" />
    <link rel="alternate" hreflang="x-default" href="/en/" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta property="og:title" content={t("seo.title")} />
    <meta property="og:description" content={t("seo.description")} />
    <meta property="og:type" content="website" />
    <meta property="og:image" content="/og-image.png" />
    <link rel="preconnect" href="https://rsms.me/" />
    <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
  </head>
  <body class="bg-white text-gray-900 font-sans antialiased">
    <slot />
  </body>
</html>
```

**Step 2: Create root redirect page**

Create `src/pages/index.astro`:

```astro
---
return Astro.redirect("/en/");
---
```

**Step 3: Create EN page**

Create `src/pages/en/index.astro`:

```astro
---
import BaseLayout from "../../layouts/BaseLayout.astro";
---

<BaseLayout>
  <main>
    <p>EN landing page — components coming next.</p>
  </main>
</BaseLayout>
```

**Step 4: Create DE page**

Create `src/pages/de/index.astro`:

```astro
---
import BaseLayout from "../../layouts/BaseLayout.astro";
---

<BaseLayout>
  <main>
    <p>DE Landingpage — Komponenten kommen als Nächstes.</p>
  </main>
</BaseLayout>
```

**Step 5: Verify dev server and routing**

```bash
cd /Users/olivier/Versioncontrol/local/effeff/landing
npm run dev
```

Verify in browser:
- `http://localhost:4321/` redirects to `/en/`
- `http://localhost:4321/en/` shows EN placeholder
- `http://localhost:4321/de/` shows DE placeholder
- Page source has correct `<html lang="...">` and hreflang tags

**Step 6: Commit**

```bash
git add landing/src/layouts/ landing/src/pages/
git commit -m "feat(landing): add BaseLayout with SEO tags and i18n page routing"
```

---

### Task 4: Build Nav component

**Files:**
- Create: `landing/src/components/Nav.astro`
- Modify: `landing/src/layouts/BaseLayout.astro` (add Nav import)

**Step 1: Create Nav component**

Create `src/components/Nav.astro`:

```astro
---
import { getLangFromUrl, useTranslations, getAlternateLang } from "../i18n/utils";
import { languages } from "../i18n/ui";

const lang = getLangFromUrl(Astro.url);
const t = useTranslations(lang);
const altLang = getAlternateLang(lang);
---

<nav class="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
  <div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
    <a href={`/${lang}/`} class="text-xl font-bold tracking-tight text-gray-900">
      effeff
    </a>
    <div class="flex items-center gap-4">
      <a
        href={`/${altLang}/`}
        class="text-sm text-gray-500 hover:text-gray-900 transition-colors"
      >
        {languages[altLang]}
      </a>
      <a
        href="https://github.com/dkd-dobberkau/effeff"
        target="_blank"
        rel="noopener noreferrer"
        class="text-gray-500 hover:text-gray-900 transition-colors"
        aria-label="GitHub"
      >
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path fill-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clip-rule="evenodd" />
        </svg>
      </a>
    </div>
  </div>
</nav>
```

**Step 2: Add Nav to BaseLayout**

In `src/layouts/BaseLayout.astro`, add the import and component:

```astro
---
import "../styles/global.css";
import Nav from "../components/Nav.astro";
import { getLangFromUrl, useTranslations } from "../i18n/utils";
// ... rest of frontmatter
---
<!-- In body, before <slot /> -->
<body class="bg-white text-gray-900 font-sans antialiased">
  <Nav />
  <slot />
</body>
```

**Step 3: Verify in browser**

Check that:
- Nav shows "effeff" logo, language switcher, GitHub icon
- Clicking DE/EN switches language and URL
- Nav is sticky on scroll

**Step 4: Commit**

```bash
git add landing/src/components/Nav.astro landing/src/layouts/BaseLayout.astro
git commit -m "feat(landing): add sticky Nav with language switcher and GitHub link"
```

---

### Task 5: Build Hero section

**Files:**
- Create: `landing/src/components/Hero.astro`
- Modify: `landing/src/pages/en/index.astro`
- Modify: `landing/src/pages/de/index.astro`

**Step 1: Copy hero screenshot to public directory**

```bash
mkdir -p /Users/olivier/Versioncontrol/local/effeff/landing/public/screenshots
cp /Users/olivier/Versioncontrol/local/effeff/docs/screenshots/02-form-editor.png \
   /Users/olivier/Versioncontrol/local/effeff/landing/public/screenshots/
```

**Step 2: Create Hero component**

Create `src/components/Hero.astro`:

```astro
---
import { getLangFromUrl, useTranslations } from "../i18n/utils";

const lang = getLangFromUrl(Astro.url);
const t = useTranslations(lang);
---

<section class="relative overflow-hidden">
  <div class="max-w-7xl mx-auto px-6 pt-24 pb-16 md:pt-32 md:pb-24">
    <div class="max-w-3xl mx-auto text-center">
      <h1 class="text-4xl md:text-6xl font-bold tracking-tight text-gray-900 leading-tight">
        {t("hero.title")}
      </h1>
      <p class="mt-6 text-lg md:text-xl text-gray-500 leading-relaxed max-w-2xl mx-auto">
        {t("hero.subtitle")}
      </p>
      <div class="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
        <a
          href="https://github.com/dkd-dobberkau/effeff"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-white font-medium hover:bg-primary-hover transition-colors"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path fill-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clip-rule="evenodd" />
          </svg>
          {t("hero.cta_primary")}
        </a>
        <a
          href="https://github.com/dkd-dobberkau/effeff/blob/main/docs/SETUP.md"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-6 py-3 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
        >
          {t("hero.cta_secondary")}
        </a>
      </div>
    </div>
    <div class="mt-16 md:mt-20 max-w-5xl mx-auto">
      <div class="rounded-xl shadow-2xl overflow-hidden border border-gray-200">
        <img
          src="/screenshots/02-form-editor.png"
          alt="effeff form editor"
          class="w-full"
          loading="eager"
        />
      </div>
    </div>
  </div>
</section>
```

**Step 3: Update EN and DE pages to use Hero**

Both `src/pages/en/index.astro` and `src/pages/de/index.astro`:

```astro
---
import BaseLayout from "../../layouts/BaseLayout.astro";
import Hero from "../../components/Hero.astro";
---

<BaseLayout>
  <Hero />
</BaseLayout>
```

**Step 4: Verify in browser**

Check both `/en/` and `/de/` show the hero with correct language.

**Step 5: Commit**

```bash
git add landing/src/components/Hero.astro landing/src/pages/ landing/public/screenshots/
git commit -m "feat(landing): add Hero section with screenshot and bilingual CTAs"
```

---

### Task 6: Build Features section

**Files:**
- Create: `landing/src/components/Features.astro`
- Modify: `landing/src/pages/en/index.astro`
- Modify: `landing/src/pages/de/index.astro`

**Step 1: Create Features component**

Create `src/components/Features.astro`:

```astro
---
import { getLangFromUrl, useTranslations } from "../i18n/utils";

const lang = getLangFromUrl(Astro.url);
const t = useTranslations(lang);

const features = [
  { key: "dnd", icon: "grip-vertical" },
  { key: "types", icon: "list" },
  { key: "renderer", icon: "play" },
  { key: "uploads", icon: "upload" },
  { key: "analytics", icon: "bar-chart" },
  { key: "selfhosted", icon: "server" },
] as const;

const icons: Record<string, string> = {
  "grip-vertical": `<path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M9 5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"/><path d="M9 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"/><path d="M9 19m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"/><path d="M15 5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"/><path d="M15 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"/><path d="M15 19m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"/>`,
  "list": `<path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M9 6h11"/><path d="M9 12h11"/><path d="M9 18h11"/><path d="M5 6v.01"/><path d="M5 12v.01"/><path d="M5 18v.01"/>`,
  "play": `<path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M7 4v16l13-8z"/>`,
  "upload": `<path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/><path d="M7 9l5-5l5 5"/><path d="M12 4v12"/>`,
  "bar-chart": `<path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 12m0 1a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1z"/><path d="M9 8m0 1a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1z"/><path d="M15 4m0 1a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1z"/>`,
  "server": `<path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 4m0 3a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v2a3 3 0 0 1-3 3h-12a3 3 0 0 1-3-3z"/><path d="M3 12m0 3a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v2a3 3 0 0 1-3 3h-12a3 3 0 0 1-3-3z"/><path d="M7 8l0 .01"/><path d="M7 16l0 .01"/>`,
};
---

<section class="bg-gray-50 py-24 md:py-32">
  <div class="max-w-7xl mx-auto px-6">
    <h2 class="text-3xl md:text-4xl font-bold text-center text-gray-900">
      {t("features.heading")}
    </h2>
    <div class="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {features.map(({ key, icon }) => (
        <div class="bg-white rounded-xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div class="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-primary mb-4">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" set:html={icons[icon]} />
          </div>
          <h3 class="text-lg font-semibold text-gray-900">
            {t(`features.${key}.title` as any)}
          </h3>
          <p class="mt-2 text-gray-500 leading-relaxed">
            {t(`features.${key}.description` as any)}
          </p>
        </div>
      ))}
    </div>
  </div>
</section>
```

**Step 2: Add Features to both pages**

In both `en/index.astro` and `de/index.astro`, add:

```astro
---
import BaseLayout from "../../layouts/BaseLayout.astro";
import Hero from "../../components/Hero.astro";
import Features from "../../components/Features.astro";
---

<BaseLayout>
  <Hero />
  <Features />
</BaseLayout>
```

**Step 3: Verify in browser**

Check the 2x3 grid renders, icons show, text is translated.

**Step 4: Commit**

```bash
git add landing/src/components/Features.astro landing/src/pages/
git commit -m "feat(landing): add Features section with 6 feature cards and icons"
```

---

### Task 7: Build Screenshots gallery

**Files:**
- Create: `landing/src/components/Screenshots.astro`
- Modify: `landing/src/pages/en/index.astro`
- Modify: `landing/src/pages/de/index.astro`

**Step 1: Copy selected screenshots**

```bash
cd /Users/olivier/Versioncontrol/local/effeff
for f in 01-forms-list 04-submissions 05-welcome 08-multiple-choice 09-rating 12-thank-you; do
  cp "docs/screenshots/${f}.png" landing/public/screenshots/
done
```

**Step 2: Create Screenshots component**

Create `src/components/Screenshots.astro`:

```astro
---
import { getLangFromUrl, useTranslations } from "../i18n/utils";

const lang = getLangFromUrl(Astro.url);
const t = useTranslations(lang);

const screenshots = [
  { src: "/screenshots/01-forms-list.png", alt: "Form list dashboard" },
  { src: "/screenshots/02-form-editor.png", alt: "Form editor with questions" },
  { src: "/screenshots/04-submissions.png", alt: "Submission analytics" },
  { src: "/screenshots/05-welcome.png", alt: "Public form welcome screen" },
  { src: "/screenshots/08-multiple-choice.png", alt: "Multiple choice question" },
  { src: "/screenshots/09-rating.png", alt: "Rating question" },
];
---

<section class="py-24 md:py-32">
  <div class="max-w-7xl mx-auto px-6">
    <h2 class="text-3xl md:text-4xl font-bold text-center text-gray-900">
      {t("screenshots.heading")}
    </h2>
    <div class="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {screenshots.map(({ src, alt }) => (
        <div class="rounded-xl overflow-hidden shadow-sm border border-gray-200 hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
          <img src={src} alt={alt} class="w-full" loading="lazy" />
        </div>
      ))}
    </div>
  </div>
</section>
```

**Step 3: Add Screenshots to both pages**

```astro
import Screenshots from "../../components/Screenshots.astro";
<!-- after Features -->
<Screenshots />
```

**Step 4: Verify in browser**

Check grid layout, hover effects, lazy loading.

**Step 5: Commit**

```bash
git add landing/src/components/Screenshots.astro landing/src/pages/ landing/public/screenshots/
git commit -m "feat(landing): add Screenshots gallery with 6 selected images"
```

---

### Task 8: Build TechStack section

**Files:**
- Create: `landing/src/components/TechStack.astro`
- Modify: `landing/src/pages/en/index.astro`
- Modify: `landing/src/pages/de/index.astro`

**Step 1: Create TechStack component**

Create `src/components/TechStack.astro`. Use text labels with subtle styling (no external logo files needed):

```astro
---
import { getLangFromUrl, useTranslations } from "../i18n/utils";

const lang = getLangFromUrl(Astro.url);
const t = useTranslations(lang);

const techs = [
  { name: "Ruby on Rails", color: "#CC0000" },
  { name: "Go", color: "#00ADD8" },
  { name: "React", color: "#61DAFB" },
  { name: "SurrealDB", color: "#FF00A0" },
  { name: "Garage S3", color: "#7C3AED" },
  { name: "Docker", color: "#2496ED" },
];
---

<section class="bg-gray-50 py-24 md:py-32">
  <div class="max-w-7xl mx-auto px-6 text-center">
    <h2 class="text-3xl md:text-4xl font-bold text-gray-900">
      {t("tech.heading")}
    </h2>
    <div class="mt-12 flex flex-wrap items-center justify-center gap-6">
      {techs.map(({ name, color }) => (
        <div class="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-5 py-2.5 shadow-sm">
          <span class="w-3 h-3 rounded-full" style={`background-color: ${color}`} />
          <span class="text-sm font-medium text-gray-700">{name}</span>
        </div>
      ))}
    </div>
    <p class="mt-8 text-gray-500">
      {t("tech.tagline")} <code class="text-sm bg-gray-100 rounded px-2 py-1 font-mono">docker compose up</code>
    </p>
  </div>
</section>
```

**Step 2: Add to both pages after Screenshots**

**Step 3: Verify and commit**

```bash
git add landing/src/components/TechStack.astro landing/src/pages/
git commit -m "feat(landing): add TechStack section with colored tech pills"
```

---

### Task 9: Build CallToAction and Footer

**Files:**
- Create: `landing/src/components/CallToAction.astro`
- Create: `landing/src/components/Footer.astro`
- Modify: `landing/src/pages/en/index.astro`
- Modify: `landing/src/pages/de/index.astro`

**Step 1: Create CallToAction component**

Create `src/components/CallToAction.astro`:

```astro
---
import { getLangFromUrl, useTranslations } from "../i18n/utils";

const lang = getLangFromUrl(Astro.url);
const t = useTranslations(lang);
---

<section class="py-24 md:py-32">
  <div class="max-w-3xl mx-auto px-6 text-center">
    <h2 class="text-3xl md:text-4xl font-bold text-gray-900">
      {t("cta.heading")}
    </h2>
    <p class="mt-4 text-lg text-gray-500">
      {t("cta.subtitle")}
    </p>
    <div class="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
      <a
        href="https://github.com/dkd-dobberkau/effeff"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-white font-medium hover:bg-primary-hover transition-colors"
      >
        {t("cta.primary")}
      </a>
      <a
        href="https://github.com/dkd-dobberkau/effeff/blob/main/docs/SETUP.md"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-6 py-3 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
      >
        {t("cta.secondary")}
      </a>
    </div>
  </div>
</section>
```

**Step 2: Create Footer component**

Create `src/components/Footer.astro`:

```astro
---
import { getLangFromUrl, useTranslations } from "../i18n/utils";

const lang = getLangFromUrl(Astro.url);
const t = useTranslations(lang);
const year = new Date().getFullYear();
---

<footer class="border-t border-gray-100 py-8">
  <div class="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
    <p>&copy; {year} effeff</p>
    <div class="flex items-center gap-6">
      <a
        href="https://github.com/dkd-dobberkau/effeff"
        target="_blank"
        rel="noopener noreferrer"
        class="hover:text-gray-600 transition-colors"
      >
        {t("footer.source")}
      </a>
    </div>
  </div>
</footer>
```

**Step 3: Assemble final page layout**

Both `en/index.astro` and `de/index.astro` should now contain:

```astro
---
import BaseLayout from "../../layouts/BaseLayout.astro";
import Hero from "../../components/Hero.astro";
import Features from "../../components/Features.astro";
import Screenshots from "../../components/Screenshots.astro";
import TechStack from "../../components/TechStack.astro";
import CallToAction from "../../components/CallToAction.astro";
import Footer from "../../components/Footer.astro";
---

<BaseLayout>
  <Hero />
  <Features />
  <Screenshots />
  <TechStack />
  <CallToAction />
  <Footer />
</BaseLayout>
```

**Step 4: Verify complete page in browser**

Walk through both `/en/` and `/de/`:
- All sections render in correct order
- Language switcher works
- All text is properly translated
- Responsive layout on mobile (use browser devtools)

**Step 5: Commit**

```bash
git add landing/src/components/CallToAction.astro landing/src/components/Footer.astro landing/src/pages/
git commit -m "feat(landing): add CallToAction, Footer, and assemble complete page"
```

---

### Task 10: Create favicon and OG image placeholder

**Files:**
- Create: `landing/public/favicon.svg`
- Create: `landing/public/og-image.png` (placeholder — can be replaced later)

**Step 1: Create simple favicon SVG**

Create `public/favicon.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="#2563eb"/>
  <text x="16" y="22" font-family="system-ui, sans-serif" font-size="18" font-weight="bold" fill="white" text-anchor="middle">ff</text>
</svg>
```

**Step 2: For OG image, use the hero screenshot as a temporary placeholder**

```bash
cp /Users/olivier/Versioncontrol/local/effeff/landing/public/screenshots/02-form-editor.png \
   /Users/olivier/Versioncontrol/local/effeff/landing/public/og-image.png
```

**Step 3: Commit**

```bash
git add landing/public/favicon.svg landing/public/og-image.png
git commit -m "feat(landing): add favicon and OG image placeholder"
```

---

### Task 11: Final build verification and cleanup

**Step 1: Run production build**

```bash
cd /Users/olivier/Versioncontrol/local/effeff/landing
npm run build
```

Expected: Clean build, no errors.

**Step 2: Preview the production build**

```bash
cd /Users/olivier/Versioncontrol/local/effeff/landing
npm run preview
```

Open `http://localhost:4321/` and verify:
- Redirect to `/en/` works
- Both `/en/` and `/de/` render correctly
- All screenshots load
- Language switcher works
- Nav is sticky
- Mobile responsive
- Page source has correct SEO tags (hreflang, OG tags, lang attribute)

**Step 3: Verify no build artifacts are committed**

```bash
git status
```

Ensure `landing/dist/` and `landing/node_modules/` are not tracked.

**Step 4: Final commit if any cleanup needed**

```bash
git add -A && git commit -m "chore(landing): cleanup and verify production build"
```
