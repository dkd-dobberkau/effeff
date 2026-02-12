import { useRef } from "react";
import { ArrowRight, Check, Upload, X } from "lucide-react";

export default function FileUpload({
  question,
  value,
  onChange,
  onNext,
  palette,
  styles,
  number,
}) {
  const fileRef = useRef(null);
  const file = value instanceof File ? value : null;

  const handleChange = (e) => {
    const f = e.target.files?.[0];
    if (f) onChange(f);
  };

  const clearFile = () => {
    onChange(undefined);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div style={styles.questionContent}>
      <QuestionHeader number={number} palette={palette} />
      <h2 style={styles.questionTitle}>{question.title}</h2>
      <p style={styles.questionSubtitle}>{question.subtitle}</p>

      <input
        ref={fileRef}
        type="file"
        onChange={handleChange}
        style={{ display: "none" }}
      />

      {!file ? (
        <button
          onClick={() => fileRef.current?.click()}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "14px 24px",
            background: "transparent",
            border: `1px dashed ${palette.border}`,
            borderRadius: "8px",
            color: palette.textMuted,
            fontSize: "15px",
            cursor: "pointer",
            transition: "border-color 0.2s",
            width: "100%",
            maxWidth: "400px",
          }}
        >
          <Upload size={18} stroke={palette.accent} />
          Datei auswählen
        </button>
      ) : (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "12px 16px",
            background: `${palette.accent}15`,
            border: `1px solid ${palette.accent}40`,
            borderRadius: "8px",
            maxWidth: "400px",
          }}
        >
          <span
            style={{
              flex: 1,
              fontSize: "14px",
              color: palette.text,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {file.name}
          </span>
          <span style={{ fontSize: "12px", color: palette.textMuted, flexShrink: 0 }}>
            {(file.size / 1024).toFixed(0)} KB
          </span>
          <button
            onClick={clearFile}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "2px",
              color: palette.textMuted,
            }}
          >
            <X size={16} />
          </button>
        </div>
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
}

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
