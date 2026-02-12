import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import { forms, submissions } from "../api/client";
import { buildPalette, fontFamily, buildStyles, buildDynamicCSS } from "./theme";
import ProgressBar from "./ProgressBar";
import Navigation from "./Navigation";
import QuestionSlide from "./QuestionSlide";
import Welcome from "./questions/Welcome";
import ThankYou from "./questions/ThankYou";
import TextInput from "./questions/TextInput";
import LongText from "./questions/LongText";
import MultipleChoice from "./questions/MultipleChoice";
import Rating from "./questions/Rating";
import YesNo from "./questions/YesNo";

export default function FormRenderer() {
  const { slug } = useParams();
  const [form, setForm] = useState(null);
  const [questionList, setQuestionList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [direction, setDirection] = useState("down");
  const [isAnimating, setIsAnimating] = useState(false);
  const [shakeError, setShakeError] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [startedAt] = useState(Date.now());
  const inputRef = useRef(null);
  const goNextRef = useRef(null);

  // Load form data
  useEffect(() => {
    forms
      .get(slug)
      .then((data) => {
        const f = data.form || data;
        setForm(f);
        const qs = data.questions || f.questions || [];
        setQuestionList(qs.sort((a, b) => (a.position || 0) - (b.position || 0)));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [slug]);

  const palette = buildPalette(form?.theme);
  const font = fontFamily(form?.theme);
  const styles = buildStyles(palette, font);
  const dynamicCSS = buildDynamicCSS(palette);

  const currentQ = questionList[currentIndex];
  const numberedQuestions = questionList.filter(
    (q) => q.type !== "welcome" && q.type !== "thank_you" && q.type !== "statement"
  );
  const totalQuestions = numberedQuestions.length;
  const answeredCount = numberedQuestions.filter(
    (q) => answers[q.id] !== undefined && answers[q.id] !== ""
  ).length;
  const progress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  // Compute the visible "number" for the current question
  const currentNumber = currentQ
    ? numberedQuestions.indexOf(currentQ) + 1 || null
    : null;

  const setAnswer = (val) => {
    if (!currentQ) return;
    setAnswers((prev) => ({ ...prev, [currentQ.id]: val }));
  };

  const canProceed = useCallback(() => {
    if (!currentQ) return false;
    if (currentQ.type === "welcome" || currentQ.type === "thank_you" || currentQ.type === "statement")
      return true;
    if (!currentQ.required) return true;
    const val = answers[currentQ.id];
    if (val === undefined || val === "") return false;
    if (
      currentQ.type === "multiple_choice" &&
      currentQ.settings?.multi_select &&
      Array.isArray(val) &&
      val.length === 0
    )
      return false;
    if (currentQ.type === "email" && val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val))
      return false;
    return true;
  }, [currentQ, answers]);

  const submitForm = useCallback(async () => {
    if (submitted) return;
    setSubmitted(true);
    const duration = Math.round((Date.now() - startedAt) / 1000);
    const answerPayload = Object.entries(answers).map(([questionId, value]) => ({
      question_id: questionId,
      value,
    }));
    try {
      await submissions.submit(slug, {
        answers: answerPayload,
        metadata: { duration_seconds: duration },
      });
    } catch {
      // Submission errors are silently accepted — the user sees thank-you regardless
    }
  }, [answers, slug, submitted, startedAt]);

  const goNext = useCallback(() => {
    if (isAnimating || !currentQ) return;
    if (!canProceed()) {
      setShakeError(true);
      setTimeout(() => setShakeError(false), 500);
      return;
    }
    if (currentIndex < questionList.length - 1) {
      // If the next question is thank_you, submit
      const nextQ = questionList[currentIndex + 1];
      if (nextQ?.type === "thank_you") submitForm();

      setDirection("down");
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((i) => i + 1);
        setIsAnimating(false);
      }, 400);
    }
  }, [currentIndex, isAnimating, canProceed, questionList, submitForm]);

  // Keep ref in sync so delayed callbacks (setTimeout) always call the latest goNext
  goNextRef.current = goNext;
  const stableGoNext = useCallback(() => goNextRef.current(), []);

  const goPrev = useCallback(() => {
    if (isAnimating || !currentQ) return;
    if (currentIndex > 0 && currentQ.type !== "thank_you") {
      setDirection("up");
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((i) => i - 1);
        setIsAnimating(false);
      }, 400);
    }
  }, [currentIndex, isAnimating, currentQ]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        if (currentQ?.type !== "long_text") {
          e.preventDefault();
          goNext();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext, currentQ]);

  // Auto-focus inputs
  useEffect(() => {
    setTimeout(() => {
      if (inputRef.current) inputRef.current.focus();
    }, 450);
  }, [currentIndex]);

  // Loading / error states
  if (loading) {
    return (
      <div style={{ ...styles.root, justifyContent: "center" }}>
        <div
          style={{
            width: "32px",
            height: "32px",
            border: `2px solid ${palette.border}`,
            borderTop: `2px solid ${palette.accent}`,
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !form || questionList.length === 0) {
    return (
      <div style={{ ...styles.root, flexDirection: "column", gap: "12px" }}>
        <p style={{ color: palette.textMuted, fontSize: "18px" }}>
          {error || "Formular nicht gefunden."}
        </p>
      </div>
    );
  }

  const showNav =
    currentQ.type !== "welcome" && currentQ.type !== "thank_you";

  return (
    <div style={styles.root}>
      <style>{dynamicCSS}</style>

      {/* Ambient background */}
      <div style={styles.ambientOrb1} />
      <div style={styles.ambientOrb2} />

      {/* Progress bar */}
      {showNav && <ProgressBar progress={progress} palette={palette} />}

      {/* Navigation buttons */}
      {showNav && (
        <Navigation
          onPrev={goPrev}
          onNext={stableGoNext}
          canGoPrev={currentIndex > 0}
          canGoNext={currentIndex < questionList.length - 1}
          palette={palette}
        />
      )}

      {/* Question counter */}
      {currentNumber && (
        <div
          style={{
            position: "fixed",
            top: "24px",
            right: "32px",
            fontSize: "13px",
            color: palette.textMuted,
            fontWeight: 500,
            letterSpacing: "0.5px",
            zIndex: 50,
          }}
        >
          {currentNumber} von {totalQuestions}
        </div>
      )}

      {/* Current question */}
      <QuestionSlide
        direction={direction}
        isAnimating={isAnimating}
        shakeError={shakeError}
      >
        {currentQ.type === "welcome" && (
          <Welcome question={currentQ} palette={palette} onNext={stableGoNext} />
        )}
        {currentQ.type === "thank_you" && (
          <ThankYou
            question={currentQ}
            palette={palette}
            onRestart={() => {
              setCurrentIndex(0);
              setAnswers({});
              setSubmitted(false);
            }}
          />
        )}
        {(currentQ.type === "text" || currentQ.type === "email") && (
          <TextInput
            ref={inputRef}
            question={currentQ}
            value={answers[currentQ.id]}
            onChange={setAnswer}
            onNext={stableGoNext}
            palette={palette}
            styles={styles}
            number={currentNumber}
          />
        )}
        {currentQ.type === "long_text" && (
          <LongText
            ref={inputRef}
            question={currentQ}
            value={answers[currentQ.id]}
            onChange={setAnswer}
            onNext={stableGoNext}
            palette={palette}
            styles={styles}
            number={currentNumber}
          />
        )}
        {currentQ.type === "multiple_choice" && (
          <MultipleChoice
            question={currentQ}
            value={answers[currentQ.id]}
            onChange={setAnswer}
            onNext={stableGoNext}
            palette={palette}
            styles={styles}
            number={currentNumber}
          />
        )}
        {currentQ.type === "rating" && (
          <Rating
            question={currentQ}
            value={answers[currentQ.id]}
            onChange={setAnswer}
            onNext={stableGoNext}
            palette={palette}
            styles={styles}
            number={currentNumber}
          />
        )}
        {currentQ.type === "yes_no" && (
          <YesNo
            question={currentQ}
            value={answers[currentQ.id]}
            onChange={setAnswer}
            onNext={stableGoNext}
            palette={palette}
            styles={styles}
            number={currentNumber}
          />
        )}
        {/* Fallback for unsupported question types */}
        {![
          "welcome", "thank_you", "text", "email", "long_text",
          "multiple_choice", "rating", "yes_no",
        ].includes(currentQ.type) && (
          <TextInput
            ref={inputRef}
            question={currentQ}
            value={answers[currentQ.id]}
            onChange={setAnswer}
            onNext={stableGoNext}
            palette={palette}
            styles={styles}
            number={currentNumber}
          />
        )}
      </QuestionSlide>

      {/* Footer */}
      <div style={styles.footer}>
        <span style={styles.footerText}>
          Erstellt mit{" "}
          <span style={{ color: palette.accent }}>FormFlow</span>
        </span>
      </div>
    </div>
  );
}
