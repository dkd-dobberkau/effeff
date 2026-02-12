export default function ProgressBar({ progress, palette }) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "3px",
        background: palette.border,
        zIndex: 100,
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${progress}%`,
          background: `linear-gradient(90deg, ${palette.accent}, ${palette.accentHover})`,
          transition: "width 0.5s cubic-bezier(0.22, 1, 0.36, 1)",
          borderRadius: "0 2px 2px 0",
        }}
      />
    </div>
  );
}
