import { CheckCircle } from "lucide-react";
import { hexToRgba } from "../theme";

export default function ThankYou({ question, palette, onRestart }) {
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
          width: "90px",
          height: "90px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "50%",
          background: hexToRgba(palette.success, 0.08),
          border: `1px solid ${hexToRgba(palette.success, 0.15)}`,
          animation: "fadeInUp 0.6s ease",
        }}
      >
        <CheckCircle size={56} stroke={palette.success} strokeWidth={1.5} />
      </div>
      <h1
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "clamp(28px, 5vw, 40px)",
          fontWeight: 600,
          marginBottom: "12px",
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
      {onRestart && (
        <button
          className="back-link"
          style={{
            background: "none",
            border: "none",
            color: palette.textMuted,
            fontSize: "14px",
            cursor: "pointer",
            textDecoration: "underline",
            textUnderlineOffset: "3px",
            fontFamily: "'DM Sans', sans-serif",
            transition: "color 0.2s ease",
          }}
          onClick={onRestart}
        >
          Nochmal ausfüllen
        </button>
      )}
    </div>
  );
}
