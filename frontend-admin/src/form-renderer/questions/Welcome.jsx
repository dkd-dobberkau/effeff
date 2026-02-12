import { Layers, ArrowRight } from "lucide-react";
import { hexToRgba } from "../theme";

export default function Welcome({ question, palette, onNext }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
      }}
    >
      <div
        style={{
          marginBottom: "32px",
          animation: "pulseGlow 3s ease infinite",
          width: "80px",
          height: "80px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "20px",
          background: hexToRgba(palette.accent, 0.1),
          border: `1px solid ${hexToRgba(palette.accent, 0.2)}`,
        }}
      >
        <Layers size={48} stroke={palette.accent} strokeWidth={1.5} />
      </div>
      <h1
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "clamp(28px, 5vw, 42px)",
          fontWeight: 600,
          lineHeight: 1.2,
          marginBottom: "16px",
          background: `linear-gradient(135deg, ${palette.text} 0%, ${palette.textMuted} 100%)`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        {question.title}
      </h1>
      <p
        style={{
          fontSize: "17px",
          color: palette.textMuted,
          lineHeight: 1.6,
          marginBottom: "40px",
          maxWidth: "400px",
        }}
      >
        {question.subtitle}
      </p>
      <button
        className="ok-btn"
        style={{
          display: "inline-flex",
          alignItems: "center",
          padding: "14px 32px",
          background: palette.accent,
          color: "white",
          border: "none",
          borderRadius: "8px",
          fontSize: "16px",
          fontWeight: 600,
          cursor: "pointer",
          transition: "all 0.2s ease",
          fontFamily: "'DM Sans', sans-serif",
          letterSpacing: "0.3px",
        }}
        onClick={onNext}
      >
        {question.settings?.button_text || "Los geht's"}
        <ArrowRight size={18} style={{ marginLeft: 8 }} />
      </button>
    </div>
  );
}
