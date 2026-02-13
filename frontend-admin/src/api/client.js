const RAILS_API = import.meta.env.VITE_RAILS_API_URL ?? "http://localhost:3000";
const GO_API = import.meta.env.VITE_GO_SUBMISSIONS_URL ?? "http://localhost:8080";

async function request(url, options = {}) {
  const headers = { ...options.headers };

  // Attach auth token for Rails API calls
  if (url.startsWith(RAILS_API)) {
    const token = localStorage.getItem("effeff_token");
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  // Set Content-Type for JSON body (skip for FormData)
  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url, { ...options, headers });

  // On 401 from Rails API, clear token and redirect to login
  if (res.status === 401 && url.startsWith(RAILS_API) && !url.includes("/auth/")) {
    localStorage.removeItem("effeff_token");
    window.location.href = "/login";
    throw new Error("Session expired");
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error || "Request failed");
  }
  return res.json();
}

// ─── Auth ───────────────────────────────────────────────────

export const auth = {
  login: (email, password) =>
    request(`${RAILS_API}/api/v1/auth/login`, {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  register: (email, password, name) =>
    request(`${RAILS_API}/api/v1/auth/register`, {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    }),

  me: () => request(`${RAILS_API}/api/v1/auth/me`),

  status: () => request(`${RAILS_API}/api/v1/auth/status`),
};

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

  exportSubmissions: (id) =>
    request(`${RAILS_API}/api/v1/forms/${encodeURIComponent(id)}/export_submissions`),
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

  submitWithFiles: (formSlug, formData) =>
    request(`${GO_API}/submit/${formSlug}`, {
      method: "POST",
      body: formData,
    }),
};

export default { auth, forms, questions, submissions };
