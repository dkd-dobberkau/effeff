export default function QuestionSlide({ direction, isAnimating, shakeError, children }) {
  const slideStyle = {
    transform: isAnimating
      ? direction === "down"
        ? "translateY(-60px)"
        : "translateY(60px)"
      : "translateY(0)",
    opacity: isAnimating ? 0 : 1,
    transition: "all 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
    width: "100%",
    maxWidth: "640px",
    padding: "24px 32px",
    zIndex: 10,
    animation: shakeError ? "shake 0.4s ease" : "none",
  };

  return <div style={slideStyle}>{children}</div>;
}
