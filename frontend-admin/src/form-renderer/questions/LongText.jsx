import { forwardRef } from "react";
import { ArrowRight, Check } from "lucide-react";

const LongText = forwardRef(function LongText(
  { question, value, onChange, onNext, palette, styles, number },
  ref
) {
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
      <textarea
        ref={ref}
        className="typeform-input"
        style={styles.textarea}
        placeholder={question.placeholder || ""}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
      />
      <div style={styles.actionRow}>
        <button className="ok-btn" style={styles.okBtn} onClick={onNext}>
          OK
          <Check size={14} style={{ marginLeft: 6 }} />
        </button>
        <span style={styles.enterHint}>
          <strong>Shift + Enter</strong> für neue Zeile
        </span>
      </div>
    </div>
  );
});

export default LongText;
