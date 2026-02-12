import { ArrowRight, ThumbsUp, ThumbsDown } from "lucide-react";

export default function YesNo({
  question,
  value,
  onChange,
  onNext,
  palette,
  styles,
  number,
}) {
  const handleClick = (val) => {
    onChange(val);
    setTimeout(onNext, 350);
  };

  const btnBase = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    width: "140px",
    height: "120px",
    borderRadius: "16px",
    border: `1px solid ${palette.border}`,
    background: "rgba(255,255,255,0.02)",
    cursor: "pointer",
    transition: "all 0.2s ease",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: "16px",
    fontWeight: 600,
    color: palette.text,
  };

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
      <div style={{ display: "flex", gap: "16px", justifyContent: "center" }}>
        <button
          className={`yesno-btn ${value === "yes" ? "selected" : ""}`}
          style={btnBase}
          onClick={() => handleClick("yes")}
        >
          <ThumbsUp size={28} stroke={value === "yes" ? palette.accent : palette.textMuted} />
          Ja
        </button>
        <button
          className={`yesno-btn ${value === "no" ? "selected" : ""}`}
          style={btnBase}
          onClick={() => handleClick("no")}
        >
          <ThumbsDown size={28} stroke={value === "no" ? palette.accent : palette.textMuted} />
          Nein
        </button>
      </div>
    </div>
  );
}
