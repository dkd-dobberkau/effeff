import { useState, useEffect, useCallback, useRef } from "react";

const QUESTIONS = [
  {
    id: 1,
    type: "welcome",
    title: "Lass uns gemeinsam etwas Großartiges schaffen",
    subtitle: "Diese Umfrage dauert nur 2 Minuten. Bereit?",
    buttonText: "Los geht's",
  },
  {
    id: 2,
    type: "text",
    number: 1,
    title: "Wie heißt du?",
    subtitle: "Wir möchten dich gerne kennenlernen.",
    placeholder: "Dein Name...",
    required: true,
  },
  {
    id: 3,
    type: "email",
    number: 2,
    title: "Wie lautet deine E-Mail-Adresse?",
    subtitle: "Keine Sorge, wir spammen nicht.",
    placeholder: "name@beispiel.de",
    required: true,
  },
  {
    id: 4,
    type: "multiple_choice",
    number: 3,
    title: "Was beschreibt dich am besten?",
    subtitle: "Wähle die passendste Option.",
    options: [
      { key: "A", label: "Entwickler:in" },
      { key: "B", label: "Designer:in" },
      { key: "C", label: "Produktmanager:in" },
      { key: "D", label: "Gründer:in" },
      { key: "E", label: "Etwas anderes" },
    ],
    required: true,
  },
  {
    id: 5,
    type: "rating",
    number: 4,
    title: "Wie zufrieden bist du mit deinem aktuellen Workflow?",
    subtitle: "1 = gar nicht, 5 = sehr zufrieden",
    max: 5,
    required: true,
  },
  {
    id: 6,
    type: "long_text",
    number: 5,
    title: "Was würdest du an deinem Arbeitsalltag ändern?",
    subtitle: "Erzähl uns mehr – jedes Detail hilft.",
    placeholder: "Schreib einfach drauf los...",
    required: false,
  },
  {
    id: 7,
    type: "multiple_choice",
    number: 6,
    title: "Wie hast du von uns erfahren?",
    subtitle: "Wähle eine oder mehrere Optionen.",
    multi: true,
    options: [
      { key: "A", label: "Social Media" },
      { key: "B", label: "Empfehlung" },
      { key: "C", label: "Google-Suche" },
      { key: "D", label: "Blog / Artikel" },
      { key: "E", label: "Konferenz / Event" },
    ],
    required: true,
  },
  {
    id: 8,
    type: "thank_you",
    title: "Vielen Dank!",
    subtitle: "Deine Antworten wurden gespeichert. Wir melden uns bald bei dir.",
  },
];

const PALETTE = {
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

export default function TypeformClone() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [direction, setDirection] = useState("down");
  const [isAnimating, setIsAnimating] = useState(false);
  const [shakeError, setShakeError] = useState(false);
  const inputRef = useRef(null);

  const currentQ = QUESTIONS[currentIndex];
  const totalQuestions = QUESTIONS.filter((q) => q.number).length;
  const answeredCount = QUESTIONS.filter((q) => q.number && answers[q.id] !== undefined).length;
  const progress = (answeredCount / totalQuestions) * 100;

  const setAnswer = (val) => {
    setAnswers((prev) => ({ ...prev, [currentQ.id]: val }));
  };

  const canProceed = () => {
    if (currentQ.type === "welcome" || currentQ.type === "thank_you") return true;
    if (!currentQ.required) return true;
    const val = answers[currentQ.id];
    if (val === undefined || val === "") return false;
    if (currentQ.type === "multiple_choice" && currentQ.multi && Array.isArray(val) && val.length === 0) return false;
    if (currentQ.type === "email" && val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return false;
    return true;
  };

  const goNext = useCallback(() => {
    if (isAnimating) return;
    if (!canProceed()) {
      setShakeError(true);
      setTimeout(() => setShakeError(false), 500);
      return;
    }
    if (currentIndex < QUESTIONS.length - 1) {
      setDirection("down");
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((i) => i + 1);
        setIsAnimating(false);
      }, 400);
    }
  }, [currentIndex, isAnimating, answers]);

  const goPrev = useCallback(() => {
    if (isAnimating) return;
    if (currentIndex > 0 && currentQ.type !== "thank_you") {
      setDirection("up");
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((i) => i - 1);
        setIsAnimating(false);
      }, 400);
    }
  }, [currentIndex, isAnimating]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        if (currentQ.type !== "long_text") {
          e.preventDefault();
          goNext();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext]);

  useEffect(() => {
    setTimeout(() => {
      if (inputRef.current) inputRef.current.focus();
    }, 450);
  }, [currentIndex]);

  const slideStyle = {
    transform: isAnimating
      ? direction === "down"
        ? "translateY(-60px)"
        : "translateY(60px)"
      : "translateY(0)",
    opacity: isAnimating ? 0 : 1,
    transition: "all 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
  };

  return (
    <div style={styles.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,700&family=Playfair+Display:wght@400;600;700&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        ::selection { background: ${PALETTE.accent}; color: white; }

        input::placeholder, textarea::placeholder {
          color: ${PALETTE.textDim};
        }

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
          0%, 100% { box-shadow: 0 0 20px ${PALETTE.accentGlow}; }
          50% { box-shadow: 0 0 40px ${PALETTE.accentGlow}, 0 0 60px rgba(108, 92, 231, 0.1); }
        }

        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .typeform-input:focus {
          outline: none;
          border-color: ${PALETTE.borderFocus} !important;
          box-shadow: 0 0 0 3px ${PALETTE.accentGlow};
        }

        .choice-btn:hover {
          border-color: ${PALETTE.accent} !important;
          background: rgba(108, 92, 231, 0.08) !important;
          transform: translateY(-1px);
        }

        .choice-btn.selected {
          border-color: ${PALETTE.accent} !important;
          background: rgba(108, 92, 231, 0.15) !important;
        }

        .rating-btn:hover {
          border-color: ${PALETTE.accent} !important;
          background: rgba(108, 92, 231, 0.12) !important;
          transform: scale(1.08);
        }

        .rating-btn.selected {
          background: ${PALETTE.accent} !important;
          border-color: ${PALETTE.accent} !important;
          color: white !important;
          transform: scale(1.05);
        }

        .nav-btn:hover:not(:disabled) {
          background: ${PALETTE.accentHover} !important;
          transform: translateY(-1px);
        }

        .nav-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .ok-btn:hover {
          background: ${PALETTE.accentHover} !important;
          transform: translateY(-1px);
        }

        .back-link:hover {
          color: ${PALETTE.text} !important;
        }

        textarea:focus {
          outline: none;
          border-color: ${PALETTE.borderFocus} !important;
          box-shadow: 0 0 0 3px ${PALETTE.accentGlow};
        }
      `}</style>

      {/* Ambient background */}
      <div style={styles.ambientOrb1} />
      <div style={styles.ambientOrb2} />

      {/* Progress bar */}
      {currentQ.type !== "welcome" && currentQ.type !== "thank_you" && (
        <div style={styles.progressBar}>
          <div
            style={{
              ...styles.progressFill,
              width: `${progress}%`,
            }}
          />
        </div>
      )}

      {/* Navigation */}
      {currentQ.type !== "welcome" && currentQ.type !== "thank_you" && (
        <div style={styles.navContainer}>
          <button
            className="nav-btn"
            style={styles.navBtn}
            onClick={goPrev}
            disabled={currentIndex === 0}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 15l-6-6-6 6" />
            </svg>
          </button>
          <button
            className="nav-btn"
            style={styles.navBtn}
            onClick={goNext}
            disabled={currentIndex === QUESTIONS.length - 1}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
        </div>
      )}

      {/* Question counter */}
      {currentQ.number && (
        <div style={styles.counter}>
          {currentQ.number} von {totalQuestions}
        </div>
      )}

      {/* Main content */}
      <div
        style={{
          ...styles.slideContainer,
          ...slideStyle,
          animation: shakeError ? "shake 0.4s ease" : "none",
        }}
      >
        {/* WELCOME */}
        {currentQ.type === "welcome" && (
          <div style={styles.centeredContent}>
            <div style={styles.welcomeIcon}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={PALETTE.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <h1 style={styles.welcomeTitle}>{currentQ.title}</h1>
            <p style={styles.welcomeSubtitle}>{currentQ.subtitle}</p>
            <button className="ok-btn" style={styles.startBtn} onClick={goNext}>
              {currentQ.buttonText}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 8 }}>
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}

        {/* TEXT INPUT */}
        {currentQ.type === "text" && (
          <div style={styles.questionContent}>
            <div style={styles.questionHeader}>
              <span style={styles.questionNumber}>{currentQ.number}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={PALETTE.accent} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 8px" }}>
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
            <h2 style={styles.questionTitle}>{currentQ.title}</h2>
            <p style={styles.questionSubtitle}>{currentQ.subtitle}</p>
            <input
              ref={inputRef}
              className="typeform-input"
              style={styles.textInput}
              type="text"
              placeholder={currentQ.placeholder}
              value={answers[currentQ.id] || ""}
              onChange={(e) => setAnswer(e.target.value)}
            />
            <div style={styles.actionRow}>
              <button className="ok-btn" style={styles.okBtn} onClick={goNext}>
                OK
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 6 }}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </button>
              <span style={styles.enterHint}>
                oder <strong>Enter ↵</strong> drücken
              </span>
            </div>
          </div>
        )}

        {/* EMAIL INPUT */}
        {currentQ.type === "email" && (
          <div style={styles.questionContent}>
            <div style={styles.questionHeader}>
              <span style={styles.questionNumber}>{currentQ.number}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={PALETTE.accent} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 8px" }}>
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
            <h2 style={styles.questionTitle}>{currentQ.title}</h2>
            <p style={styles.questionSubtitle}>{currentQ.subtitle}</p>
            <input
              ref={inputRef}
              className="typeform-input"
              style={styles.textInput}
              type="email"
              placeholder={currentQ.placeholder}
              value={answers[currentQ.id] || ""}
              onChange={(e) => setAnswer(e.target.value)}
            />
            {answers[currentQ.id] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(answers[currentQ.id]) && (
              <p style={styles.errorText}>Bitte gib eine gültige E-Mail-Adresse ein.</p>
            )}
            <div style={styles.actionRow}>
              <button className="ok-btn" style={styles.okBtn} onClick={goNext}>
                OK
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 6 }}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </button>
              <span style={styles.enterHint}>
                oder <strong>Enter ↵</strong> drücken
              </span>
            </div>
          </div>
        )}

        {/* MULTIPLE CHOICE */}
        {currentQ.type === "multiple_choice" && (
          <div style={styles.questionContent}>
            <div style={styles.questionHeader}>
              <span style={styles.questionNumber}>{currentQ.number}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={PALETTE.accent} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 8px" }}>
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
            <h2 style={styles.questionTitle}>{currentQ.title}</h2>
            <p style={styles.questionSubtitle}>{currentQ.subtitle}</p>
            <div style={styles.choiceList}>
              {currentQ.options.map((opt) => {
                const val = answers[currentQ.id];
                const isSelected = currentQ.multi
                  ? Array.isArray(val) && val.includes(opt.key)
                  : val === opt.key;

                return (
                  <button
                    key={opt.key}
                    className={`choice-btn ${isSelected ? "selected" : ""}`}
                    style={styles.choiceBtn}
                    onClick={() => {
                      if (currentQ.multi) {
                        const current = Array.isArray(val) ? val : [];
                        if (current.includes(opt.key)) {
                          setAnswer(current.filter((k) => k !== opt.key));
                        } else {
                          setAnswer([...current, opt.key]);
                        }
                      } else {
                        setAnswer(opt.key);
                        setTimeout(goNext, 350);
                      }
                    }}
                  >
                    <span style={{
                      ...styles.choiceKey,
                      ...(isSelected ? styles.choiceKeySelected : {}),
                    }}>
                      {opt.key}
                    </span>
                    <span style={styles.choiceLabel}>{opt.label}</span>
                    {isSelected && (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={PALETTE.accent} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: "auto" }}>
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
            {currentQ.multi && (
              <div style={styles.actionRow}>
                <button className="ok-btn" style={styles.okBtn} onClick={goNext}>
                  OK
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 6 }}>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}

        {/* RATING */}
        {currentQ.type === "rating" && (
          <div style={styles.questionContent}>
            <div style={styles.questionHeader}>
              <span style={styles.questionNumber}>{currentQ.number}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={PALETTE.accent} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 8px" }}>
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
            <h2 style={styles.questionTitle}>{currentQ.title}</h2>
            <p style={styles.questionSubtitle}>{currentQ.subtitle}</p>
            <div style={styles.ratingRow}>
              {Array.from({ length: currentQ.max }, (_, i) => {
                const val = i + 1;
                const isSelected = answers[currentQ.id] === val;
                return (
                  <button
                    key={val}
                    className={`rating-btn ${isSelected ? "selected" : ""}`}
                    style={styles.ratingBtn}
                    onClick={() => {
                      setAnswer(val);
                      setTimeout(goNext, 400);
                    }}
                  >
                    {val}
                  </button>
                );
              })}
            </div>
            <div style={styles.ratingLabels}>
              <span>Gar nicht</span>
              <span>Sehr zufrieden</span>
            </div>
          </div>
        )}

        {/* LONG TEXT */}
        {currentQ.type === "long_text" && (
          <div style={styles.questionContent}>
            <div style={styles.questionHeader}>
              <span style={styles.questionNumber}>{currentQ.number}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={PALETTE.accent} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 8px" }}>
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
            <h2 style={styles.questionTitle}>{currentQ.title}</h2>
            <p style={styles.questionSubtitle}>{currentQ.subtitle}</p>
            <textarea
              ref={inputRef}
              className="typeform-input"
              style={styles.textarea}
              placeholder={currentQ.placeholder}
              value={answers[currentQ.id] || ""}
              onChange={(e) => setAnswer(e.target.value)}
              rows={4}
            />
            <div style={styles.actionRow}>
              <button className="ok-btn" style={styles.okBtn} onClick={goNext}>
                OK
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 6 }}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </button>
              <span style={styles.enterHint}>
                <strong>Shift + Enter</strong> für neue Zeile
              </span>
            </div>
          </div>
        )}

        {/* THANK YOU */}
        {currentQ.type === "thank_you" && (
          <div style={styles.centeredContent}>
            <div style={styles.thankYouIcon}>
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke={PALETTE.success} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h1 style={styles.thankYouTitle}>{currentQ.title}</h1>
            <p style={styles.welcomeSubtitle}>{currentQ.subtitle}</p>
            <button
              className="back-link"
              style={styles.restartLink}
              onClick={() => {
                setCurrentIndex(0);
                setAnswers({});
              }}
            >
              Nochmal ausfüllen
            </button>
          </div>
        )}
      </div>

      {/* Footer branding */}
      <div style={styles.footer}>
        <span style={styles.footerText}>
          Erstellt mit <span style={{ color: PALETTE.accent }}>FormFlow</span>
        </span>
      </div>
    </div>
  );
}

const styles = {
  root: {
    fontFamily: "'DM Sans', sans-serif",
    background: PALETTE.bg,
    color: PALETTE.text,
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
    background: "radial-gradient(circle, rgba(108, 92, 231, 0.08) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  ambientOrb2: {
    position: "fixed",
    bottom: "-15%",
    left: "-10%",
    width: "500px",
    height: "500px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(0, 184, 148, 0.05) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  progressBar: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    height: "3px",
    background: PALETTE.border,
    zIndex: 100,
  },
  progressFill: {
    height: "100%",
    background: `linear-gradient(90deg, ${PALETTE.accent}, #a29bfe)`,
    transition: "width 0.5s cubic-bezier(0.22, 1, 0.36, 1)",
    borderRadius: "0 2px 2px 0",
  },
  navContainer: {
    position: "fixed",
    bottom: "32px",
    right: "32px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    zIndex: 50,
  },
  navBtn: {
    width: "36px",
    height: "36px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: PALETTE.accent,
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    fontSize: "14px",
  },
  counter: {
    position: "fixed",
    top: "24px",
    right: "32px",
    fontSize: "13px",
    color: PALETTE.textMuted,
    fontWeight: 500,
    letterSpacing: "0.5px",
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
  welcomeIcon: {
    marginBottom: "32px",
    animation: "pulseGlow 3s ease infinite",
    width: "80px",
    height: "80px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "20px",
    background: "rgba(108, 92, 231, 0.1)",
    border: `1px solid rgba(108, 92, 231, 0.2)`,
  },
  welcomeTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: "clamp(28px, 5vw, 42px)",
    fontWeight: 600,
    lineHeight: 1.2,
    marginBottom: "16px",
    background: `linear-gradient(135deg, ${PALETTE.text} 0%, ${PALETTE.textMuted} 100%)`,
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  welcomeSubtitle: {
    fontSize: "17px",
    color: PALETTE.textMuted,
    lineHeight: 1.6,
    marginBottom: "40px",
    maxWidth: "400px",
  },
  startBtn: {
    display: "inline-flex",
    alignItems: "center",
    padding: "14px 32px",
    background: PALETTE.accent,
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s ease",
    fontFamily: "'DM Sans', sans-serif",
    letterSpacing: "0.3px",
  },
  questionContent: {
    maxWidth: "580px",
  },
  questionHeader: {
    display: "flex",
    alignItems: "center",
    marginBottom: "12px",
  },
  questionNumber: {
    fontSize: "14px",
    fontWeight: 700,
    color: PALETTE.accent,
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
    color: PALETTE.textMuted,
    marginBottom: "32px",
    lineHeight: 1.5,
  },
  textInput: {
    width: "100%",
    padding: "16px 0",
    background: "transparent",
    border: "none",
    borderBottom: `2px solid ${PALETTE.border}`,
    color: PALETTE.text,
    fontSize: "20px",
    fontFamily: "'DM Sans', sans-serif",
    transition: "all 0.3s ease",
    outline: "none",
  },
  textarea: {
    width: "100%",
    padding: "16px",
    background: "rgba(255,255,255,0.03)",
    border: `1px solid ${PALETTE.border}`,
    borderRadius: "10px",
    color: PALETTE.text,
    fontSize: "16px",
    fontFamily: "'DM Sans', sans-serif",
    transition: "all 0.3s ease",
    resize: "vertical",
    lineHeight: 1.6,
    minHeight: "120px",
  },
  errorText: {
    color: PALETTE.errorRed,
    fontSize: "13px",
    marginTop: "8px",
  },
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
    background: PALETTE.accent,
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s ease",
    fontFamily: "'DM Sans', sans-serif",
  },
  enterHint: {
    fontSize: "13px",
    color: PALETTE.textDim,
  },
  choiceList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  choiceBtn: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "14px 18px",
    background: "rgba(255,255,255,0.02)",
    border: `1px solid ${PALETTE.border}`,
    borderRadius: "10px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    textAlign: "left",
    width: "100%",
    fontFamily: "'DM Sans', sans-serif",
    color: PALETTE.text,
  },
  choiceKey: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "28px",
    height: "28px",
    borderRadius: "6px",
    border: `1px solid ${PALETTE.border}`,
    fontSize: "12px",
    fontWeight: 700,
    color: PALETTE.textMuted,
    flexShrink: 0,
    transition: "all 0.2s ease",
  },
  choiceKeySelected: {
    background: PALETTE.accent,
    borderColor: PALETTE.accent,
    color: "white",
  },
  choiceLabel: {
    fontSize: "15px",
    fontWeight: 500,
  },
  ratingRow: {
    display: "flex",
    gap: "12px",
    justifyContent: "center",
    marginBottom: "12px",
  },
  ratingBtn: {
    width: "56px",
    height: "56px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "12px",
    border: `1px solid ${PALETTE.border}`,
    background: "rgba(255,255,255,0.02)",
    color: PALETTE.textMuted,
    fontSize: "18px",
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 0.2s ease",
    fontFamily: "'DM Sans', sans-serif",
  },
  ratingLabels: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "12px",
    color: PALETTE.textDim,
    maxWidth: "330px",
    margin: "0 auto",
  },
  thankYouIcon: {
    marginBottom: "32px",
    width: "90px",
    height: "90px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    background: "rgba(0, 184, 148, 0.08)",
    border: "1px solid rgba(0, 184, 148, 0.15)",
    animation: "fadeInUp 0.6s ease",
  },
  thankYouTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: "clamp(28px, 5vw, 40px)",
    fontWeight: 600,
    marginBottom: "12px",
  },
  restartLink: {
    marginTop: "16px",
    background: "none",
    border: "none",
    color: PALETTE.textMuted,
    fontSize: "14px",
    cursor: "pointer",
    textDecoration: "underline",
    textUnderlineOffset: "3px",
    fontFamily: "'DM Sans', sans-serif",
    transition: "color 0.2s ease",
  },
  footer: {
    position: "fixed",
    bottom: "32px",
    left: "32px",
    zIndex: 50,
  },
  footerText: {
    fontSize: "12px",
    color: PALETTE.textDim,
    fontWeight: 500,
    letterSpacing: "0.5px",
  },
};
