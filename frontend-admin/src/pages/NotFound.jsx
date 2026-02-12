import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <h1 className="font-display text-6xl font-bold text-gray-700 dark:text-gray-300">404</h1>
      <p className="mt-3 text-lg text-gray-500">Seite nicht gefunden.</p>
      <Link
        to="/"
        className="mt-6 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
      >
        Zur Startseite
      </Link>
    </div>
  );
}
