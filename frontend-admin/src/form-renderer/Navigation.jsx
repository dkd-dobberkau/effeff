import { ChevronUp, ChevronDown } from "lucide-react";

export default function Navigation({ onPrev, onNext, canGoPrev, canGoNext, palette }) {
  const btnStyle = {
    width: "36px",
    height: "36px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: palette.accent,
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "all 0.2s ease",
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: "32px",
        right: "32px",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        zIndex: 50,
      }}
    >
      <button
        className="nav-btn"
        style={btnStyle}
        onClick={onPrev}
        disabled={!canGoPrev}
        aria-label="Vorherige Frage"
      >
        <ChevronUp size={16} />
      </button>
      <button
        className="nav-btn"
        style={btnStyle}
        onClick={onNext}
        disabled={!canGoNext}
        aria-label="Nächste Frage"
      >
        <ChevronDown size={16} />
      </button>
    </div>
  );
}
