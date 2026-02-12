import { ArrowRight, Check } from "lucide-react";

export default function MultipleChoice({
  question,
  value,
  onChange,
  onNext,
  palette,
  styles,
  number,
}) {
  const multi = question.settings?.multi_select || false;
  const options = question.options || [];

  const handleClick = (optKey) => {
    if (multi) {
      const current = Array.isArray(value) ? value : [];
      if (current.includes(optKey)) {
        onChange(current.filter((k) => k !== optKey));
      } else {
        onChange([...current, optKey]);
      }
    } else {
      onChange(optKey);
      setTimeout(onNext, 350);
    }
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
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {options.map((opt) => {
          const isSelected = multi
            ? Array.isArray(value) && value.includes(opt.key)
            : value === opt.key;

          return (
            <button
              key={opt.key}
              className={`choice-btn ${isSelected ? "selected" : ""}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                padding: "14px 18px",
                background: "rgba(255,255,255,0.02)",
                border: `1px solid ${palette.border}`,
                borderRadius: "10px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                textAlign: "left",
                width: "100%",
                fontFamily: "'DM Sans', sans-serif",
                color: palette.text,
              }}
              onClick={() => handleClick(opt.key)}
            >
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "28px",
                  height: "28px",
                  borderRadius: "6px",
                  border: `1px solid ${isSelected ? palette.accent : palette.border}`,
                  fontSize: "12px",
                  fontWeight: 700,
                  color: isSelected ? "white" : palette.textMuted,
                  background: isSelected ? palette.accent : "transparent",
                  flexShrink: 0,
                  transition: "all 0.2s ease",
                }}
              >
                {opt.key}
              </span>
              <span style={{ fontSize: "15px", fontWeight: 500 }}>{opt.label}</span>
              {isSelected && (
                <Check
                  size={18}
                  stroke={palette.accent}
                  strokeWidth={3}
                  style={{ marginLeft: "auto" }}
                />
              )}
            </button>
          );
        })}
      </div>
      {multi && (
        <div style={styles.actionRow}>
          <button className="ok-btn" style={styles.okBtn} onClick={onNext}>
            OK
            <Check size={14} style={{ marginLeft: 6 }} />
          </button>
        </div>
      )}
    </div>
  );
}
