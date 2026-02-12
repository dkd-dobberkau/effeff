const VARIANTS = {
  draft:
    "bg-yellow-50 text-yellow-700 border-yellow-300 dark:bg-yellow-900/40 dark:text-yellow-400 dark:border-yellow-800",
  published:
    "bg-green-50 text-green-700 border-green-300 dark:bg-green-900/40 dark:text-green-400 dark:border-green-800",
  archived:
    "bg-gray-100 text-gray-500 border-gray-300 dark:bg-gray-800/60 dark:text-gray-400 dark:border-gray-700",
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
