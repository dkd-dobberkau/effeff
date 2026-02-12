export const DARK_PALETTE = {
  bg: "#0a0a0f",
  bgCard: "#12121a",
  accent: "#6c5ce7",
  accentHover: "#7f70f0",
  accentGlow: "rgba(108, 92, 231, 0.25)",
  text: "#f0eff4",
  textMuted: "#8b8a97",
  textDim: "#5a596a",
  border: "#2a2a3a",
  borderFocus: "#6c5ce7",
  success: "#00b894",
  errorRed: "#ff6b6b",
  white: "#ffffff",
};

export const LIGHT_PALETTE = {
  bg: "#ffffff",
  bgCard: "#f8f8fa",
  accent: "#6c5ce7",
  accentHover: "#5a4bd6",
  accentGlow: "rgba(108, 92, 231, 0.15)",
  text: "#1a1a2e",
  textMuted: "#6b6b80",
  textDim: "#9b9baf",
  border: "#e2e2ea",
  borderFocus: "#6c5ce7",
  success: "#00b894",
  errorRed: "#e74c3c",
  white: "#ffffff",
};

// Keep for backward compatibility
export const DEFAULT_PALETTE = DARK_PALETTE;

export function buildPalette(formTheme) {
  if (!formTheme) return DARK_PALETTE;

  const isLight = formTheme.theme_mode === "light";
  const base = isLight ? LIGHT_PALETTE : DARK_PALETTE;

  return {
    ...base,
    bg: formTheme.bg_color || base.bg,
    accent: formTheme.accent_color || base.accent,
    accentHover: formTheme.accent_color
      ? (isLight ? darken(formTheme.accent_color, 15) : lighten(formTheme.accent_color, 15))
      : base.accentHover,
    accentGlow: formTheme.accent_color
      ? hexToRgba(formTheme.accent_color, isLight ? 0.15 : 0.25)
      : base.accentGlow,
    borderFocus: formTheme.accent_color || base.borderFocus,
  };
}

export function fontFamily(formTheme) {
  const font = formTheme?.font_family || "DM Sans";
  return `'${font}', sans-serif`;
}

export function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function lighten(hex, percent) {
  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);
  r = Math.min(255, r + Math.round((255 - r) * (percent / 100)));
  g = Math.min(255, g + Math.round((255 - g) * (percent / 100)));
  b = Math.min(255, b + Math.round((255 - b) * (percent / 100)));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function darken(hex, percent) {
  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);
  r = Math.max(0, r - Math.round(r * (percent / 100)));
  g = Math.max(0, g - Math.round(g * (percent / 100)));
  b = Math.max(0, b - Math.round(b * (percent / 100)));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

export function buildStyles(p, font) {
  const isLight = p.bg === "#ffffff" || p.bg === LIGHT_PALETTE.bg;
  const textareaBg = isLight ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.03)";

  return {
    root: {
      fontFamily: font,
      background: p.bg,
      color: p.text,
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      overflow: "hidden",
    },
    ambientOrb1: {
      position: "fixed",
      top: "-20%",
      right: "-10%",
      width: "600px",
      height: "600px",
      borderRadius: "50%",
      background: `radial-gradient(circle, ${hexToRgba(p.accent, 0.08)} 0%, transparent 70%)`,
      pointerEvents: "none",
    },
    ambientOrb2: {
      position: "fixed",
      bottom: "-15%",
      left: "-10%",
      width: "500px",
      height: "500px",
      borderRadius: "50%",
      background: `radial-gradient(circle, ${hexToRgba(p.success, 0.05)} 0%, transparent 70%)`,
      pointerEvents: "none",
    },
    slideContainer: {
      width: "100%",
      maxWidth: "640px",
      padding: "24px 32px",
      zIndex: 10,
    },
    centeredContent: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      textAlign: "center",
    },
    questionContent: { maxWidth: "580px" },
    questionHeader: {
      display: "flex",
      alignItems: "center",
      marginBottom: "12px",
    },
    questionNumber: {
      fontSize: "14px",
      fontWeight: 700,
      color: p.accent,
    },
    questionTitle: {
      fontFamily: "'Playfair Display', serif",
      fontSize: "clamp(22px, 4vw, 30px)",
      fontWeight: 600,
      lineHeight: 1.3,
      marginBottom: "8px",
    },
    questionSubtitle: {
      fontSize: "15px",
      color: p.textMuted,
      marginBottom: "32px",
      lineHeight: 1.5,
    },
    textInput: {
      width: "100%",
      padding: "16px 0",
      background: "transparent",
      border: "none",
      borderBottom: `2px solid ${p.border}`,
      color: p.text,
      fontSize: "20px",
      fontFamily: font,
      transition: "all 0.3s ease",
      outline: "none",
    },
    textarea: {
      width: "100%",
      padding: "16px",
      background: textareaBg,
      border: `1px solid ${p.border}`,
      borderRadius: "10px",
      color: p.text,
      fontSize: "16px",
      fontFamily: font,
      transition: "all 0.3s ease",
      resize: "vertical",
      lineHeight: 1.6,
      minHeight: "120px",
    },
    errorText: { color: p.errorRed, fontSize: "13px", marginTop: "8px" },
    actionRow: {
      display: "flex",
      alignItems: "center",
      gap: "16px",
      marginTop: "24px",
    },
    okBtn: {
      display: "inline-flex",
      alignItems: "center",
      padding: "10px 22px",
      background: p.accent,
      color: "white",
      border: "none",
      borderRadius: "6px",
      fontSize: "14px",
      fontWeight: 600,
      cursor: "pointer",
      transition: "all 0.2s ease",
      fontFamily: font,
    },
    enterHint: { fontSize: "13px", color: p.textDim },
    footer: { position: "fixed", bottom: "32px", left: "32px", zIndex: 50 },
    footerText: {
      fontSize: "12px",
      color: p.textDim,
      fontWeight: 500,
      letterSpacing: "0.5px",
    },
  };
}

export function buildDynamicCSS(p) {
  return `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    ::selection { background: ${p.accent}; color: white; }
    input::placeholder, textarea::placeholder { color: ${p.textDim}; }
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      20% { transform: translateX(-8px); }
      40% { transform: translateX(8px); }
      60% { transform: translateX(-5px); }
      80% { transform: translateX(5px); }
    }
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes pulseGlow {
      0%, 100% { box-shadow: 0 0 20px ${p.accentGlow}; }
      50% { box-shadow: 0 0 40px ${p.accentGlow}, 0 0 60px ${hexToRgba(p.accent, 0.1)}; }
    }
    .typeform-input:focus {
      outline: none;
      border-color: ${p.borderFocus} !important;
      box-shadow: 0 0 0 3px ${p.accentGlow};
    }
    .choice-btn:hover {
      border-color: ${p.accent} !important;
      background: ${hexToRgba(p.accent, 0.08)} !important;
      transform: translateY(-1px);
    }
    .choice-btn.selected {
      border-color: ${p.accent} !important;
      background: ${hexToRgba(p.accent, 0.15)} !important;
    }
    .rating-btn:hover {
      border-color: ${p.accent} !important;
      background: ${hexToRgba(p.accent, 0.12)} !important;
      transform: scale(1.08);
    }
    .rating-btn.selected {
      background: ${p.accent} !important;
      border-color: ${p.accent} !important;
      color: white !important;
      transform: scale(1.05);
    }
    .nav-btn:hover:not(:disabled) {
      background: ${p.accentHover} !important;
      transform: translateY(-1px);
    }
    .nav-btn:disabled { opacity: 0.3; cursor: not-allowed; }
    .ok-btn:hover { background: ${p.accentHover} !important; transform: translateY(-1px); }
    .back-link:hover { color: ${p.text} !important; }
    textarea:focus {
      outline: none;
      border-color: ${p.borderFocus} !important;
      box-shadow: 0 0 0 3px ${p.accentGlow};
    }
    .yesno-btn:hover {
      border-color: ${p.accent} !important;
      background: ${hexToRgba(p.accent, 0.08)} !important;
      transform: translateY(-2px);
    }
    .yesno-btn.selected {
      border-color: ${p.accent} !important;
      background: ${hexToRgba(p.accent, 0.15)} !important;
    }
  `;
}
