import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { forms } from "../api/client";
import useFormApi from "../hooks/useFormApi";
import Spinner from "../components/Spinner";

export default function Submissions() {
  const { id } = useParams();
  const [page, setPage] = useState(1);

  const { data: form, loading: formLoading } = useFormApi(
    () => forms.getById(id),
    [id]
  );
  const { data: analytics } = useFormApi(() => forms.analytics(id), [id]);
  const {
    data: subData,
    loading: subLoading,
    error,
  } = useFormApi(() => forms.submissions(id, page), [id, page]);

  const submissionList = Array.isArray(subData)
    ? subData
    : subData?.submissions || [];
  const meta = subData?.meta || {};
  const perPage = meta.per_page || 50;
  const totalPages = meta.total ? Math.ceil(meta.total / perPage) : 1;
  const stats = analytics || {};

  if (formLoading || subLoading) return <Spinner className="mt-32" />;
  if (error)
    return <div className="mt-32 text-center text-red-400">Fehler: {error}</div>;

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <Link
          to={`/forms/${encodeURIComponent(id)}`}
          className="text-gray-500 hover:text-gray-300"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-bold">Einsendungen</h1>
          {form && (
            <p className="text-sm text-gray-500">{form.title}</p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Gesamt"
          value={stats.total_submissions ?? submissionList.length}
        />
        <StatCard
          label="Abschlussrate"
          value={
            stats.completion_rate != null
              ? `${Math.round(stats.completion_rate * 100)}%`
              : "–"
          }
        />
        <StatCard
          label="Durchschn. Dauer"
          value={
            stats.avg_duration != null
              ? `${Math.round(stats.avg_duration)}s`
              : "–"
          }
        />
        <StatCard
          label="Gestartet"
          value={stats.total_started ?? "–"}
        />
      </div>

      {/* Table */}
      {submissionList.length === 0 ? (
        <div className="mt-16 text-center text-gray-600">
          Noch keine Einsendungen vorhanden.
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-gray-800">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-900/70">
                  <th className="px-4 py-3 font-medium text-gray-400">#</th>
                  <th className="px-4 py-3 font-medium text-gray-400">
                    Eingegangen
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-400">
                    Antworten
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-400">
                    Dauer
                  </th>
                </tr>
              </thead>
              <tbody>
                {submissionList.map((sub, idx) => (
                  <tr
                    key={sub.id || idx}
                    className="border-b border-gray-800/50 transition-colors hover:bg-gray-900/40"
                  >
                    <td className="px-4 py-3 text-gray-500">
                      {(page - 1) * perPage + idx + 1}
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      {sub.completed_at
                        ? new Date(sub.completed_at).toLocaleString("de-DE", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "–"}
                    </td>
                    <td className="max-w-md truncate px-4 py-3 text-gray-300">
                      {formatAnswers(sub.answers)}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {sub.metadata?.duration_seconds
                        ? `${sub.metadata.duration_seconds}s`
                        : "–"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-gray-800 p-2 text-gray-400 hover:bg-gray-800 disabled:opacity-30"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="px-3 text-sm text-gray-500">
                Seite {page} von {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-lg border border-gray-800 p-2 text-gray-400 hover:bg-gray-800 disabled:opacity-30"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/50 px-4 py-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="mt-1 text-xl font-bold">{value}</div>
    </div>
  );
}

function formatAnswers(answers) {
  if (!Array.isArray(answers) || answers.length === 0) return "–";
  return answers
    .slice(0, 3)
    .map((a) => {
      const val = Array.isArray(a.value) ? a.value.join(", ") : String(a.value);
      return val.length > 30 ? val.slice(0, 30) + "..." : val;
    })
    .join(" | ");
}
