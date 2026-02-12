const VARIANTS = {
  draft: "bg-yellow-900/40 text-yellow-400 border-yellow-800",
  published: "bg-green-900/40 text-green-400 border-green-800",
  archived: "bg-gray-800/60 text-gray-400 border-gray-700",
};

const LABELS = {
  draft: "Entwurf",
  published: "Veröffentlicht",
  archived: "Archiviert",
};

export default function StatusBadge({ status }) {
  const variant = VARIANTS[status] || VARIANTS.draft;
  return (
    <span
      className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${variant}`}
    >
      {LABELS[status] || status}
    </span>
  );
}
