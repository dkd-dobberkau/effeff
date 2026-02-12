import { forwardRef } from "react";
import { ArrowRight, Check } from "lucide-react";

const TextInput = forwardRef(function TextInput(
  { question, value, onChange, onNext, palette, styles, number },
  ref
) {
  const isEmail = question.type === "email";
  const emailInvalid =
    isEmail && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  return (
    <div style={styles.questionContent}>
      <QuestionHeader number={number} palette={palette} />
      <h2 style={styles.questionTitle}>{question.title}</h2>
      <p style={styles.questionSubtitle}>{question.subtitle}</p>
      <input
        ref={ref}
        className="typeform-input"
        style={styles.textInput}
        type={isEmail ? "email" : "text"}
        placeholder={question.placeholder || ""}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
      />
      {emailInvalid && (
        <p style={styles.errorText}>
          Bitte gib eine gültige E-Mail-Adresse ein.
        </p>
      )}
      <div style={styles.actionRow}>
        <button className="ok-btn" style={styles.okBtn} onClick={onNext}>
          OK
          <Check size={14} style={{ marginLeft: 6 }} />
        </button>
        <span style={styles.enterHint}>
          oder <strong>Enter &crarr;</strong> drücken
        </span>
      </div>
    </div>
  );
});

function QuestionHeader({ number, palette }) {
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: "12px" }}>
      <span style={{ fontSize: "14px", fontWeight: 700, color: palette.accent }}>
        {number}
      </span>
      <ArrowRight
        size={14}
        stroke={palette.accent}
        strokeWidth={3}
        style={{ margin: "0 8px" }}
      />
    </div>
  );
}

export default TextInput;
