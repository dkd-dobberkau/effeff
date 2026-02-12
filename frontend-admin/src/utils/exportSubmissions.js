const NON_ANSWER_TYPES = ["welcome", "thank_you", "statement"];

function filterQuestions(questions) {
  return questions.filter((q) => !NON_ANSWER_TYPES.includes(q.type));
}

function formatValue(val) {
  if (val == null) return "";
  if (Array.isArray(val)) return val.join(", ");
  return String(val);
}

function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function escapeCsv(str) {
  const s = String(str);
  if (s.includes('"') || s.includes(",") || s.includes("\n") || s.includes(";")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function escapeMd(str) {
  return String(str).replace(/\|/g, "\\|").replace(/\n/g, " ");
}

export function exportAsCSV(data) {
  const questions = filterQuestions(data.questions || []);
  const headers = ["#", "Eingegangen", "Dauer (s)", ...questions.map((q) => q.title)];

  const rows = (data.submissions || []).map((sub, idx) => {
    const answerMap = {};
    (sub.resolved_answers || []).forEach((a) => {
      answerMap[a.question_id] = formatValue(a.value);
    });

    return [
      idx + 1,
      formatDate(sub.completed_at),
      sub.duration_seconds ?? "",
      ...questions.map((q) => answerMap[q.id] ?? ""),
    ];
  });

  const bom = "\uFEFF";
  const csv = [
    headers.map(escapeCsv).join(";"),
    ...rows.map((row) => row.map(escapeCsv).join(";")),
  ].join("\n");

  return bom + csv;
}

export function exportAsJSON(data) {
  const questions = filterQuestions(data.questions || []);
  const questionIds = new Set(questions.map((q) => q.id));

  const result = (data.submissions || []).map((sub, idx) => {
    const antworten = {};
    (sub.resolved_answers || []).forEach((a) => {
      if (questionIds.has(a.question_id)) {
        antworten[a.question_title] = a.value;
      }
    });

    return {
      nr: idx + 1,
      eingegangen: sub.completed_at || null,
      dauer_sekunden: sub.duration_seconds ?? null,
      antworten,
    };
  });

  return JSON.stringify(result, null, 2);
}

export function exportAsMarkdown(data) {
  const questions = filterQuestions(data.questions || []);
  const headers = ["#", "Eingegangen", "Dauer (s)", ...questions.map((q) => q.title)];

  const separator = headers.map(() => "---");

  const rows = (data.submissions || []).map((sub, idx) => {
    const answerMap = {};
    (sub.resolved_answers || []).forEach((a) => {
      answerMap[a.question_id] = formatValue(a.value);
    });

    return [
      idx + 1,
      formatDate(sub.completed_at),
      sub.duration_seconds ?? "",
      ...questions.map((q) => answerMap[q.id] ?? ""),
    ];
  });

  const title = `# ${data.form_title || "Formular"} - Einsendungen\n\n`;
  const table = [
    `| ${headers.map(escapeMd).join(" | ")} |`,
    `| ${separator.join(" | ")} |`,
    ...rows.map((row) => `| ${row.map((c) => escapeMd(c)).join(" | ")} |`),
  ].join("\n");

  return title + table + "\n";
}

export function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
