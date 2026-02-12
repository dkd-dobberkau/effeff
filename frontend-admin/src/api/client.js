const RAILS_API = import.meta.env.VITE_RAILS_API_URL ?? "http://localhost:3000";
const GO_API = import.meta.env.VITE_GO_SUBMISSIONS_URL ?? "http://localhost:8080";

async function request(url, options = {}) {
  const headers = { ...options.headers };
  if (options.body) headers["Content-Type"] = "application/json";

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error || "Request failed");
  }
  return res.json();
}

// ─── Forms ─────────────────────────────────────────────────

export const forms = {
  list: (status) =>
    request(`${RAILS_API}/api/v1/forms${status ? `?status=${status}` : ""}`).then(
      (r) => r.forms || r
    ),

  get: (slug) =>
    request(`${RAILS_API}/api/v1/forms/public/${slug}`),

  getById: (id) =>
    request(`${RAILS_API}/api/v1/forms/${encodeURIComponent(id)}`).then(
      (r) => r.form || r
    ),

  create: (data) =>
    request(`${RAILS_API}/api/v1/forms`, {
      method: "POST",
      body: JSON.stringify({ form: data }),
    }).then((r) => r.form || r),

  update: (id, data) =>
    request(`${RAILS_API}/api/v1/forms/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify({ form: data }),
    }).then((r) => r.form || r),

  delete: (id) =>
    request(`${RAILS_API}/api/v1/forms/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),

  submissions: (id, page = 1) =>
    request(
      `${RAILS_API}/api/v1/forms/${encodeURIComponent(id)}/submissions?page=${page}`
    ),

  analytics: (id) =>
    request(`${RAILS_API}/api/v1/forms/${encodeURIComponent(id)}/analytics`).then(
      (r) => r.analytics || r
    ),
};

// ─── Questions ─────────────────────────────────────────────

export const questions = {
  list: (formId) =>
    request(
      `${RAILS_API}/api/v1/forms/${encodeURIComponent(formId)}/questions`
    ).then((r) => r.questions || r),

  create: (formId, data) =>
    request(`${RAILS_API}/api/v1/forms/${encodeURIComponent(formId)}/questions`, {
      method: "POST",
      body: JSON.stringify({ question: data }),
    }).then((r) => r.question || r),

  update: (formId, questionId, data) =>
    request(
      `${RAILS_API}/api/v1/forms/${encodeURIComponent(formId)}/questions/${encodeURIComponent(questionId)}`,
      { method: "PUT", body: JSON.stringify({ question: data }) }
    ).then((r) => r.question || r),

  delete: (formId, questionId) =>
    request(
      `${RAILS_API}/api/v1/forms/${encodeURIComponent(formId)}/questions/${encodeURIComponent(questionId)}`,
      { method: "DELETE" }
    ),

  reorder: (formId, questionIds) =>
    request(`${RAILS_API}/api/v1/forms/${encodeURIComponent(formId)}/questions/reorder`, {
      method: "PUT",
      body: JSON.stringify({ question_ids: questionIds }),
    }),
};

// ─── Submissions (Go Service) ──────────────────────────────

export const submissions = {
  submit: (formSlug, data) =>
    request(`${GO_API}/submit/${formSlug}`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

export default { forms, questions, submissions };
