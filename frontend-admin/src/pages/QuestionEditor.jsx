import { useState, useEffect } from "react";
import { X } from "lucide-react";

const QUESTION_TYPES = [
  { value: "welcome", label: "Willkommen" },
  { value: "text", label: "Text" },
  { value: "email", label: "E-Mail" },
  { value: "long_text", label: "Langer Text" },
  { value: "multiple_choice", label: "Multiple Choice" },
  { value: "rating", label: "Bewertung" },
  { value: "yes_no", label: "Ja / Nein" },
  { value: "number", label: "Zahl" },
  { value: "date", label: "Datum" },
  { value: "url", label: "URL" },
  { value: "phone", label: "Telefon" },
  { value: "statement", label: "Statement" },
  { value: "thank_you", label: "Danke" },
];

const EMPTY_QUESTION = {
  type: "text",
  title: "",
  subtitle: "",
  placeholder: "",
  required: false,
  options: [],
  settings: {},
};

export default function QuestionEditor({ question, onSave, onClose, saving }) {
  const [form, setForm] = useState(EMPTY_QUESTION);

  useEffect(() => {
    if (question) {
      setForm({
        type: question.type || "text",
        title: question.title || "",
        subtitle: question.subtitle || "",
        placeholder: question.placeholder || "",
        required: question.required ?? false,
        options: question.options || [],
        settings: question.settings || {},
      });
    } else {
      setForm(EMPTY_QUESTION);
    }
  }, [question]);

  const setField = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...form };
    if (!["multiple_choice"].includes(payload.type)) {
      delete payload.options;
    }
    if (!payload.subtitle) delete payload.subtitle;
    if (!payload.placeholder) delete payload.placeholder;
    onSave(payload);
  };

  const addOption = () => {
    const keys = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const nextKey = keys[form.options.length] || `${form.options.length + 1}`;
    setField("options", [...form.options, { key: nextKey, label: "" }]);
  };

  const updateOption = (idx, label) => {
    const updated = form.options.map((o, i) => (i === idx ? { ...o, label } : o));
    setField("options", updated);
  };

  const removeOption = (idx) => {
    setField("options", form.options.filter((_, i) => i !== idx));
  };

  const showOptions = form.type === "multiple_choice";
  const showPlaceholder = ["text", "email", "long_text", "number", "url", "phone"].includes(form.type);
  const showRequired = !["welcome", "thank_you", "statement"].includes(form.type);
  const showRatingMax = form.type === "rating";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/50">
      <div className="flex h-full w-full max-w-lg flex-col border-l border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-800">
          <h2 className="text-lg font-semibold">
            {question ? "Frage bearbeiten" : "Neue Frage"}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-5">
          {/* Type */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-600 dark:text-gray-400">Typ</label>
            <select
              value={form.type}
              onChange={(e) => setField("type", e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-accent focus:outline-none dark:border-gray-700 dark:bg-gray-900"
            >
              {QUESTION_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-600 dark:text-gray-400">Titel</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-accent focus:outline-none dark:border-gray-700 dark:bg-gray-900"
              placeholder="Deine Frage..."
            />
          </div>

          {/* Subtitle */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-600 dark:text-gray-400">
              Untertitel <span className="text-gray-400 dark:text-gray-600">(optional)</span>
            </label>
            <input
              type="text"
              value={form.subtitle}
              onChange={(e) => setField("subtitle", e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-accent focus:outline-none dark:border-gray-700 dark:bg-gray-900"
              placeholder="Zusatzinfo..."
            />
          </div>

          {/* Placeholder */}
          {showPlaceholder && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-600 dark:text-gray-400">
                Platzhalter <span className="text-gray-400 dark:text-gray-600">(optional)</span>
              </label>
              <input
                type="text"
                value={form.placeholder}
                onChange={(e) => setField("placeholder", e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-accent focus:outline-none dark:border-gray-700 dark:bg-gray-900"
              />
            </div>
          )}

          {/* Required */}
          {showRequired && (
            <label className="flex items-center gap-2.5 text-sm">
              <input
                type="checkbox"
                checked={form.required}
                onChange={(e) => setField("required", e.target.checked)}
                className="h-4 w-4 rounded border-gray-400 bg-gray-100 accent-accent dark:border-gray-600 dark:bg-gray-800"
              />
              <span className="text-gray-700 dark:text-gray-300">Pflichtfeld</span>
            </label>
          )}

          {/* Rating max */}
          {showRatingMax && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-600 dark:text-gray-400">
                Maximale Bewertung
              </label>
              <input
                type="number"
                min={2}
                max={10}
                value={form.settings.max || 5}
                onChange={(e) =>
                  setField("settings", { ...form.settings, max: Number(e.target.value) })
                }
                className="w-24 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-accent focus:outline-none dark:border-gray-700 dark:bg-gray-900"
              />
            </div>
          )}

          {/* Multiple choice options */}
          {showOptions && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-600 dark:text-gray-400">Optionen</label>
              <div className="flex flex-col gap-2">
                {form.options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-gray-300 text-xs font-bold text-gray-500 dark:border-gray-700">
                      {opt.key}
                    </span>
                    <input
                      type="text"
                      value={opt.label}
                      onChange={(e) => updateOption(idx, e.target.value)}
                      placeholder="Option..."
                      className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-accent focus:outline-none dark:border-gray-700 dark:bg-gray-900"
                    />
                    <button
                      type="button"
                      onClick={() => removeOption(idx)}
                      className="text-gray-400 hover:text-red-500 dark:text-gray-600 dark:hover:text-red-400"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addOption}
                className="mt-2 text-sm text-accent hover:underline"
              >
                + Option hinzufügen
              </button>

              <label className="mt-3 flex items-center gap-2.5 text-sm">
                <input
                  type="checkbox"
                  checked={form.settings.multi_select || false}
                  onChange={(e) =>
                    setField("settings", { ...form.settings, multi_select: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-gray-400 bg-gray-100 accent-accent dark:border-gray-600 dark:bg-gray-800"
                />
                <span className="text-gray-700 dark:text-gray-300">Mehrfachauswahl erlauben</span>
              </label>
            </div>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Actions */}
          <div className="flex items-center gap-3 border-t border-gray-200 pt-4 dark:border-gray-800">
            <button
              type="submit"
              disabled={saving || !form.title.trim()}
              className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
            >
              {saving ? "Speichern..." : "Speichern"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2.5 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Abbrechen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
