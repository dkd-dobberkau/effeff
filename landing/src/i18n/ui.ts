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
    "hero.subtitle": "Like commercial form builders — but open source and self-hosted. Create beautiful forms, collect submissions, upload files — all on your own infrastructure.",
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
    "footer.imprint": "Legal Notice",
    "footer.privacy": "Privacy Policy",

    // SEO
    "seo.title": "effeff — Self-hosted form builder",
    "seo.description": "Create beautiful forms, collect submissions, upload files. Open-source form builder you can host yourself.",
    "seo.imprint_title": "Legal Notice — effeff",
    "seo.privacy_title": "Privacy Policy — effeff",
  },
  de: {
    // Nav
    "nav.github": "GitHub",

    // Hero
    "hero.title": "Formulare erstellen. Selbst gehostet.",
    "hero.subtitle": "Wie kommerzielle Formular-Tools — aber Open Source und selbst gehostet. Erstelle Formulare, sammle Einsendungen, lade Dateien hoch — alles auf deiner eigenen Infrastruktur.",
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
    "footer.imprint": "Impressum",
    "footer.privacy": "Datenschutz",

    // SEO
    "seo.title": "effeff — Selbst-gehosteter Formular-Builder",
    "seo.description": "Erstelle Formulare, sammle Einsendungen, lade Dateien hoch. Der Open-Source Formular-Builder zum Selbsthosten.",
    "seo.imprint_title": "Impressum — effeff",
    "seo.privacy_title": "Datenschutz — effeff",
  },
} as const;
