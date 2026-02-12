import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { forms } from "../api/client";
import useFormApi from "../hooks/useFormApi";
import Spinner from "../components/Spinner";
import { exportAsCSV, exportAsJSON, exportAsMarkdown, downloadFile } from "../utils/exportSubmissions";

export default function Submissions() {
  const { id } = useParams();
  const [page, setPage] = useState(1);
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const dropdownRef = useRef(null);

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

  useEffect(() => {
    if (!exportOpen) return;
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setExportOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [exportOpen]);

  const handleExport = async (format) => {
    setExporting(true);
    setExportOpen(false);
    try {
      const data = await forms.exportSubmissions(id);
      const title = data.form_title || "export";
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      if (format === "csv") {
        downloadFile(exportAsCSV(data), `${slug}-einsendungen.csv`, "text/csv;charset=utf-8");
      } else if (format === "json") {
        downloadFile(exportAsJSON(data), `${slug}-einsendungen.json`, "application/json");
      } else {
        downloadFile(exportAsMarkdown(data), `${slug}-einsendungen.md`, "text/markdown");
      }
    } catch {
      // export failed
    } finally {
      setExporting(false);
    }
  };

  if (formLoading || subLoading) return <Spinner className="mt-32" />;
  if (error)
    return <div className="mt-32 text-center text-red-600 dark:text-red-400">Fehler: {error}</div>;

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <Link
          to={`/forms/${encodeURIComponent(id)}`}
          className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Einsendungen</h1>
          {form && (
            <p className="text-sm text-gray-500">{form.title}</p>
          )}
        </div>
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setExportOpen((v) => !v)}
            disabled={exporting}
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <Download size={14} />
            {exporting ? "Exportieren..." : "Exportieren"}
          </button>
          {exportOpen && (
            <div className="absolute right-0 z-20 mt-1 w-52 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
              <button
                onClick={() => handleExport("csv")}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Als CSV exportieren
              </button>
              <button
                onClick={() => handleExport("json")}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Als JSON exportieren
              </button>
              <button
                onClick={() => handleExport("markdown")}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Als Markdown exportieren
              </button>
            </div>
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
        <div className="mt-16 text-center text-gray-400 dark:text-gray-600">
          Noch keine Einsendungen vorhanden.
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-100/70 dark:border-gray-800 dark:bg-gray-900/70">
                  <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">#</th>
                  <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">
                    Eingegangen
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">
                    Antworten
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">
                    Dauer
                  </th>
                </tr>
              </thead>
              <tbody>
                {submissionList.map((sub, idx) => (
                  <tr
                    key={sub.id || idx}
                    className="border-b border-gray-100 transition-colors hover:bg-gray-50 dark:border-gray-800/50 dark:hover:bg-gray-900/40"
                  >
                    <td className="px-4 py-3 text-gray-500">
                      {(page - 1) * perPage + idx + 1}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
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
                    <td className="max-w-md truncate px-4 py-3 text-gray-700 dark:text-gray-300">
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
                className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-200 disabled:opacity-30 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="px-3 text-sm text-gray-500">
                Seite {page} von {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-200 disabled:opacity-30 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-gray-800"
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
    <div className="rounded-xl border border-gray-200 bg-gray-100/50 px-4 py-3 dark:border-gray-800 dark:bg-gray-900/50">
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
