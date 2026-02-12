import { ArrowRight } from "lucide-react";

export default function Rating({
  question,
  value,
  onChange,
  onNext,
  palette,
  styles,
  number,
}) {
  const max = question.settings?.max || 5;
  const minLabel = question.settings?.labels?.min || "Gar nicht";
  const maxLabel = question.settings?.labels?.max || "Sehr zufrieden";

  return (
    <div style={styles.questionContent}>
      <div style={styles.questionHeader}>
        <span style={styles.questionNumber}>{number}</span>
        <ArrowRight
          size={14}
          stroke={palette.accent}
          strokeWidth={3}
          style={{ margin: "0 8px" }}
        />
      </div>
      <h2 style={styles.questionTitle}>{question.title}</h2>
      <p style={styles.questionSubtitle}>{question.subtitle}</p>
      <div
        style={{
          display: "flex",
          gap: "12px",
          justifyContent: "center",
          marginBottom: "12px",
        }}
      >
        {Array.from({ length: max }, (_, i) => {
          const val = i + 1;
          const isSelected = value === val;
          return (
            <button
              key={val}
              className={`rating-btn ${isSelected ? "selected" : ""}`}
              style={{
                width: "56px",
                height: "56px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "12px",
                border: `1px solid ${palette.border}`,
                background: "rgba(255,255,255,0.02)",
                color: palette.textMuted,
                fontSize: "18px",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s ease",
                fontFamily: "'DM Sans', sans-serif",
              }}
              onClick={() => {
                onChange(val);
                setTimeout(onNext, 400);
              }}
            >
              {val}
            </button>
          );
        })}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "12px",
          color: palette.textDim,
          maxWidth: `${max * 68}px`,
          margin: "0 auto",
        }}
      >
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  );
}
