# Landing Page Design — effeff

**Date:** 2026-02-13
**Status:** Approved

## Goal

Create a bilingual (DE/EN) landing page for effeff that serves three purposes:
1. Promote the open-source project (GitHub stars, contributors)
2. Market the product to a broader audience (self-hosted Typeform alternative)
3. Showcase the project as a portfolio piece

## Tech Stack

- **Astro** — Static site generator with built-in i18n routing
- **Tailwind CSS** — Utility-first styling, consistent with the existing frontend
- **Static output** — No server required, deployable anywhere

## Project Structure

```
landing/
├── astro.config.mjs
├── tailwind.config.mjs
├── package.json
├── public/
│   ├── screenshots/        # Copied from docs/screenshots/
│   ├── favicon.svg
│   └── og-image.png
├── src/
│   ├── i18n/
│   │   ├── de.json
│   │   └── en.json
│   ├── layouts/
│   │   └── BaseLayout.astro
│   ├── components/
│   │   ├── Hero.astro
│   │   ├── Features.astro
│   │   ├── Screenshots.astro
│   │   ├── TechStack.astro
│   │   ├── CallToAction.astro
│   │   ├── Nav.astro
│   │   └── Footer.astro
│   └── pages/
│       ├── index.astro     # Redirect to /en/
│       ├── de/
│       │   └── index.astro
│       └── en/
│           └── index.astro
```

## Page Sections

### Nav (sticky)
- Logo "effeff" left
- Language switcher (DE | EN) right
- GitHub link (icon) right

### Hero
- Large headline: "Formulare erstellen. Selbst gehostet." / "Build forms. Self-hosted."
- Two-line subtitle explaining the product
- Two CTAs: "View on GitHub" (primary) + "Setup Guide" (secondary)
- Hero screenshot (admin dashboard) with shadow/browser mockup

### Features (2x3 grid)
1. Drag & Drop Builder
2. 14 Question Types
3. Animated Form Renderer
4. File Uploads (S3)
5. Submission Analytics
6. Self-Hosted / GDPR-compliant

### Screenshots (gallery)
- 4-6 selected screenshots in two rows
- Admin (editor, submissions) and public form (welcome, multiple choice, rating, thank you)
- Hover animation (scale/shadow)

### Tech Stack
- Horizontal row with logos: Rails, Go, React, SurrealDB, Garage, Docker
- Tagline: "Five services, one `docker compose up`"

### Call to Action
- "Ready to get started?" with GitHub button + docs link

### Footer
- Copyright, GitHub, Docs links

## Design System

### Colors
- Background: White (#ffffff), alternating sections light gray (#f9fafb)
- Text: Dark gray (#111827) headlines, medium gray (#6b7280) body
- Accent: Strong blue for CTAs and links
- No dark mode initially

### Typography
- Inter or system font stack
- Headlines: bold, 48px (hero), 32px (sections)
- Body: regular, 18px, line-height 1.6-1.75

### Spacing
- Sections: 96-128px vertical padding
- Max-width container: 1200px, centered
- Generous whitespace

### Responsive
- Mobile-first
- Features grid becomes single column
- Screenshots stack vertically
- Nav becomes compact

## i18n

### Routing
- Default locale: `en`
- Locales: `en`, `de`
- `/` redirects to `/en/`
- `/de/` and `/en/` paths

### Translation files
Flat JSON structure grouped by section (`hero.title`, `features.dnd.title`, etc.).

### SEO per language
- `<html lang="...">` attribute
- `<link rel="alternate" hreflang="...">` tags
- Unique `<title>` and `<meta description>` per locale
- Open Graph tags per locale

## Build & Deployment

- `cd landing && npm run build` produces static files in `dist/`
- Deployable to GitHub Pages, Netlify, Vercel, or any static host
- No deployment pipeline configured initially

## Integration

- `landing/` directory at repo root (alongside `rails-api/`, `go-submissions/`, `frontend-admin/`)
- Independent `package.json`
- Screenshots copied from `docs/screenshots/` to `public/screenshots/`
- `.gitignore`: `landing/node_modules/`, `landing/dist/`
