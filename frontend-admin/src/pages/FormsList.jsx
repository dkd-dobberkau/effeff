import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, FileText, ArrowRight } from "lucide-react";
import { forms } from "../api/client";
import useFormApi from "../hooks/useFormApi";
import StatusBadge from "../components/StatusBadge";
import Spinner from "../components/Spinner";

export default function FormsList() {
  const { data, loading, error, refetch } = useFormApi(() => forms.list());
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  const handleCreate = async () => {
    setCreating(true);
    try {
      const form = await forms.create({ title: "Neues Formular" });
      if (form?.id) navigate(`/forms/${encodeURIComponent(form.id)}`);
      else refetch();
    } catch {
      refetch();
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <Spinner className="mt-32" />;
  if (error)
    return (
      <div className="mt-32 text-center text-red-400">
        Fehler: {error}
        <button onClick={refetch} className="ml-3 underline">
          Erneut versuchen
        </button>
      </div>
    );

  const formList = Array.isArray(data) ? data : [];

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Formulare</h1>
        <button
          onClick={handleCreate}
          disabled={creating}
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          <Plus size={16} />
          Neues Formular
        </button>
      </div>

      {formList.length === 0 ? (
        <div className="mt-24 text-center text-gray-500">
          <FileText size={48} className="mx-auto mb-4 text-gray-700" />
          <p>Noch keine Formulare vorhanden.</p>
          <p className="text-sm">Erstelle dein erstes Formular.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {formList.map((form) => (
            <Link
              key={form.id}
              to={`/forms/${encodeURIComponent(form.id)}`}
              className="group rounded-xl border border-gray-800 bg-gray-900/50 p-5 transition-colors hover:border-gray-700 hover:bg-gray-900"
            >
              <div className="mb-3 flex items-start justify-between">
                <h2 className="font-semibold leading-snug">{form.title}</h2>
                <ArrowRight
                  size={16}
                  className="mt-1 shrink-0 text-gray-600 transition-transform group-hover:translate-x-0.5 group-hover:text-gray-400"
                />
              </div>
              {form.description && (
                <p className="mb-3 line-clamp-2 text-sm text-gray-500">
                  {form.description}
                </p>
              )}
              <div className="flex items-center justify-between">
                <StatusBadge status={form.status} />
                {form.slug && (
                  <span className="text-xs text-gray-600">/f/{form.slug}</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
