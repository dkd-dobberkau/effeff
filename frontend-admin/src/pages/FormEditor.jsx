import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Plus,
  Trash2,
  Pencil,
  ExternalLink,
  BarChart3,
  Save,
} from "lucide-react";
import { forms, questions } from "../api/client";
import useFormApi from "../hooks/useFormApi";
import Spinner from "../components/Spinner";
import StatusBadge from "../components/StatusBadge";
import QuestionEditor from "./QuestionEditor";

const TYPE_LABELS = {
  welcome: "Willkommen",
  thank_you: "Danke",
  text: "Text",
  email: "E-Mail",
  long_text: "Langer Text",
  multiple_choice: "Multiple Choice",
  rating: "Bewertung",
  yes_no: "Ja/Nein",
  number: "Zahl",
  date: "Datum",
  url: "URL",
  phone: "Telefon",
  statement: "Statement",
  file_upload: "Datei-Upload",
};

function SortableQuestion({ question, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-100/50 px-4 py-3 transition-colors hover:border-gray-300 dark:border-gray-800 dark:bg-gray-900/50 dark:hover:border-gray-700"
    >
      <button
        aria-label="Reihenfolge ändern"
        {...attributes}
        {...listeners}
        className="cursor-grab text-gray-400 hover:text-gray-600 active:cursor-grabbing dark:text-gray-600 dark:hover:text-gray-400"
      >
        <GripVertical size={16} />
      </button>
      <span className="shrink-0 rounded bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
        {TYPE_LABELS[question.type] || question.type}
      </span>
      <span className="flex-1 truncate text-sm">{question.title}</span>
      {question.required && (
        <span className="text-xs text-red-600 dark:text-red-400">*</span>
      )}
      <button
        aria-label="Bearbeiten"
        onClick={() => onEdit(question)}
        className="text-gray-400 hover:text-accent dark:text-gray-600"
      >
        <Pencil size={14} />
      </button>
      <button
        aria-label="Löschen"
        onClick={() => onDelete(question)}
        className="text-gray-400 hover:text-red-500 dark:text-gray-600 dark:hover:text-red-400"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

export default function FormEditor() {
  const { id } = useParams();
  const {
    data: form,
    loading: formLoading,
    error: formError,
    refetch: refetchForm,
  } = useFormApi(() => forms.getById(id), [id]);
  const {
    data: questionData,
    loading: qLoading,
    refetch: refetchQuestions,
  } = useFormApi(() => questions.list(id), [id]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("draft");
  const [themeMode, setThemeMode] = useState("dark");
  const [dirty, setDirty] = useState(false);
  const [savingForm, setSavingForm] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [editorQuestion, setEditorQuestion] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [savingQuestion, setSavingQuestion] = useState(false);

  // Sync form data into local state when loaded
  useEffect(() => {
    if (form && !dirty) {
      setTitle(form.title || "");
      setDescription(form.description || "");
      setStatus(form.status || "draft");
      setThemeMode(form.theme?.theme_mode || "dark");
    }
  }, [form]);

  const questionList = Array.isArray(questionData) ? questionData : [];

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = useCallback(
    async (event) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIdx = questionList.findIndex((q) => q.id === active.id);
      const newIdx = questionList.findIndex((q) => q.id === over.id);
      const reordered = arrayMove(questionList, oldIdx, newIdx);
      try {
        await questions.reorder(id, reordered.map((q) => q.id));
      } catch {
        // reorder failed silently
      }
      refetchQuestions();
    },
    [questionList, id, refetchQuestions]
  );

  const saveForm = async () => {
    setSavingForm(true);
    setSaveError(null);
    try {
      const theme = { ...(form?.theme || {}), theme_mode: themeMode };
      await forms.update(id, { title, description, status, theme });
      setDirty(false);
      refetchForm();
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSavingForm(false);
    }
  };

  const openNewQuestion = () => {
    setEditorQuestion(null);
    setEditorOpen(true);
  };

  const openEditQuestion = (q) => {
    setEditorQuestion(q);
    setEditorOpen(true);
  };

  const handleSaveQuestion = async (data) => {
    setSavingQuestion(true);
    try {
      if (editorQuestion) {
        await questions.update(id, editorQuestion.id, data);
      } else {
        await questions.create(id, data);
      }
      setEditorOpen(false);
      refetchQuestions();
    } catch {
      // error is visible via savingQuestion resetting
    } finally {
      setSavingQuestion(false);
    }
  };

  const handleDeleteQuestion = async (q) => {
    if (!confirm(`"${q.title}" wirklich löschen?`)) return;
    try {
      await questions.delete(id, q.id);
    } catch {
      // deletion failed
    }
    refetchQuestions();
  };

  if (formLoading || qLoading) return <Spinner className="mt-32" />;
  if (formError)
    return <div className="mt-32 text-center text-red-600 dark:text-red-400">Fehler: {formError}</div>;
  if (!form) return <div className="mt-32 text-center text-gray-500">Formular nicht gefunden.</div>;

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <Link to="/" className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
          &larr; Alle Formulare
        </Link>
        <div className="flex items-center gap-3">
          {form.slug && (
            <a
              href={`/f/${form.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-accent"
            >
              <ExternalLink size={14} />
              Vorschau
            </a>
          )}
          <Link
            to={`/forms/${encodeURIComponent(id)}/submissions`}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-accent"
          >
            <BarChart3 size={14} />
            Einsendungen
          </Link>
        </div>
      </div>

      {/* Form details */}
      <div className="mb-8 rounded-xl border border-gray-200 bg-gray-100/50 p-6 dark:border-gray-800 dark:bg-gray-900/50">
        <div className="mb-4 flex items-start justify-between">
          <h2 className="text-lg font-semibold">Formular-Details</h2>
          <StatusBadge status={form.status} />
        </div>
        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-600 dark:text-gray-400">Titel</label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setDirty(true);
              }}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-accent focus:outline-none dark:border-gray-700 dark:bg-gray-900"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-600 dark:text-gray-400">
              Beschreibung <span className="text-gray-400 dark:text-gray-600">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setDirty(true);
              }}
              rows={2}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-accent focus:outline-none dark:border-gray-700 dark:bg-gray-900"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-600 dark:text-gray-400">Status</label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setDirty(true);
              }}
              className="w-48 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-accent focus:outline-none dark:border-gray-700 dark:bg-gray-900"
            >
              <option value="draft">Entwurf</option>
              <option value="published">Veröffentlicht</option>
              <option value="archived">Archiviert</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-600 dark:text-gray-400">Formular-Design</label>
            <select
              value={themeMode}
              onChange={(e) => {
                setThemeMode(e.target.value);
                setDirty(true);
              }}
              className="w-48 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-accent focus:outline-none dark:border-gray-700 dark:bg-gray-900"
            >
              <option value="dark">Dunkles Design</option>
              <option value="light">Helles Design</option>
            </select>
          </div>
          {dirty && (
            <div className="flex items-center gap-3">
              <button
                onClick={saveForm}
                disabled={savingForm}
                className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
              >
                <Save size={14} />
                {savingForm ? "Speichern..." : "Speichern"}
              </button>
              {saveError && (
                <span className="text-sm text-red-600 dark:text-red-400">{saveError}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Questions */}
      <div className="rounded-xl border border-gray-200 bg-gray-100/50 p-6 dark:border-gray-800 dark:bg-gray-900/50">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Fragen</h2>
          <button
            onClick={openNewQuestion}
            className="flex items-center gap-1.5 rounded-lg bg-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <Plus size={14} />
            Frage hinzufügen
          </button>
        </div>

        {questionList.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400 dark:text-gray-600">
            Noch keine Fragen. Füge deine erste Frage hinzu.
          </p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={questionList.map((q) => q.id)} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col gap-2">
                {questionList.map((q) => (
                  <SortableQuestion
                    key={q.id}
                    question={q}
                    onEdit={openEditQuestion}
                    onDelete={handleDeleteQuestion}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Question editor panel */}
      {editorOpen && (
        <QuestionEditor
          question={editorQuestion}
          onSave={handleSaveQuestion}
          onClose={() => setEditorOpen(false)}
          saving={savingQuestion}
        />
      )}
    </div>
  );
}
