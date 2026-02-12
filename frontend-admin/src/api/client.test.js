import { describe, it, expect, vi, beforeEach } from "vitest";

// Must mock fetch before importing the module
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock import.meta.env
vi.stubEnv("VITE_RAILS_API_URL", "http://rails:3000");
vi.stubEnv("VITE_GO_SUBMISSIONS_URL", "http://go:8080");

// Dynamic import to pick up env stubs
let forms, questions, submissions;

beforeEach(async () => {
  vi.resetModules();
  mockFetch.mockReset();

  const mod = await import("./client.js");
  forms = mod.forms;
  questions = mod.questions;
  submissions = mod.submissions;
});

function mockSuccess(data) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve(data),
  });
}

function mockError(status, body = {}) {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status,
    statusText: "Error",
    json: () => Promise.resolve(body),
  });
}

describe("forms", () => {
  it("list fetches GET /api/v1/forms", async () => {
    mockSuccess({ forms: [{ id: "form:1" }] });
    const result = await forms.list();

    expect(mockFetch).toHaveBeenCalledWith(
      "http://rails:3000/api/v1/forms",
      expect.objectContaining({ headers: {} })
    );
    expect(result).toEqual([{ id: "form:1" }]);
  });

  it("list with status filter", async () => {
    mockSuccess({ forms: [{ id: "form:1", status: "published" }] });
    await forms.list("published");

    expect(mockFetch).toHaveBeenCalledWith(
      "http://rails:3000/api/v1/forms?status=published",
      expect.anything()
    );
  });

  it("get fetches by slug", async () => {
    mockSuccess({ form: { id: "form:1", slug: "my-form" } });
    const result = await forms.get("my-form");

    expect(mockFetch).toHaveBeenCalledWith(
      "http://rails:3000/api/v1/forms/public/my-form",
      expect.anything()
    );
    // forms.get returns the full response (no unwrapping)
    expect(result.form.slug).toBe("my-form");
  });

  it("getById fetches by ID", async () => {
    mockSuccess({ form: { id: "form:abc" } });
    const result = await forms.getById("form:abc");

    expect(mockFetch).toHaveBeenCalledWith(
      "http://rails:3000/api/v1/forms/form%3Aabc",
      expect.anything()
    );
    expect(result.id).toBe("form:abc");
  });

  it("create sends POST with form data", async () => {
    mockSuccess({ form: { id: "form:new1", title: "New" } });
    const result = await forms.create({ title: "New" });

    expect(mockFetch).toHaveBeenCalledWith(
      "http://rails:3000/api/v1/forms",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ form: { title: "New" } }),
      })
    );
    expect(result.title).toBe("New");
  });

  it("update sends PUT", async () => {
    mockSuccess({ form: { id: "form:1", title: "Updated" } });
    await forms.update("form:1", { title: "Updated" });

    expect(mockFetch).toHaveBeenCalledWith(
      "http://rails:3000/api/v1/forms/form%3A1",
      expect.objectContaining({ method: "PUT" })
    );
  });

  it("delete sends DELETE", async () => {
    mockSuccess({ deleted: true });
    await forms.delete("form:1");

    expect(mockFetch).toHaveBeenCalledWith(
      "http://rails:3000/api/v1/forms/form%3A1",
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("submissions fetches paginated", async () => {
    mockSuccess({ submissions: [], meta: { total: 0, page: 2 } });
    await forms.submissions("form:1", 2);

    expect(mockFetch).toHaveBeenCalledWith(
      "http://rails:3000/api/v1/forms/form%3A1/submissions?page=2",
      expect.anything()
    );
  });
});

describe("questions", () => {
  it("list fetches questions for form", async () => {
    mockSuccess({ questions: [{ id: "q:1" }] });
    const result = await questions.list("form:1");

    expect(mockFetch).toHaveBeenCalledWith(
      "http://rails:3000/api/v1/forms/form%3A1/questions",
      expect.anything()
    );
    expect(result).toEqual([{ id: "q:1" }]);
  });

  it("create sends POST", async () => {
    mockSuccess({ question: { id: "q:new" } });
    await questions.create("form:1", { type: "text", title: "Name" });

    expect(mockFetch).toHaveBeenCalledWith(
      "http://rails:3000/api/v1/forms/form%3A1/questions",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ question: { type: "text", title: "Name" } }),
      })
    );
  });

  it("update sends PUT", async () => {
    mockSuccess({ question: { id: "q:1" } });
    await questions.update("form:1", "q:1", { title: "Updated" });

    expect(mockFetch).toHaveBeenCalledWith(
      "http://rails:3000/api/v1/forms/form%3A1/questions/q%3A1",
      expect.objectContaining({ method: "PUT" })
    );
  });

  it("delete sends DELETE", async () => {
    mockSuccess({ deleted: true });
    await questions.delete("form:1", "q:1");

    expect(mockFetch).toHaveBeenCalledWith(
      "http://rails:3000/api/v1/forms/form%3A1/questions/q%3A1",
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("reorder sends PUT with question_ids", async () => {
    mockSuccess({ reordered: true });
    await questions.reorder("form:1", ["q:2", "q:1"]);

    expect(mockFetch).toHaveBeenCalledWith(
      "http://rails:3000/api/v1/forms/form%3A1/questions/reorder",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ question_ids: ["q:2", "q:1"] }),
      })
    );
  });
});

describe("submissions", () => {
  it("submit sends POST to Go service", async () => {
    mockSuccess({ success: true, id: "sub:1" });
    const result = await submissions.submit("my-form", {
      answers: [{ question_id: "q:1", value: "test" }],
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "http://go:8080/submit/my-form",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          answers: [{ question_id: "q:1", value: "test" }],
        }),
      })
    );
    expect(result.success).toBe(true);
  });
});

describe("error handling", () => {
  it("throws on HTTP error with error message from body", async () => {
    mockError(404, { error: "Form not found" });

    await expect(forms.get("missing")).rejects.toThrow("Form not found");
  });

  it("throws with statusText when body is not JSON", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      json: () => Promise.reject(new Error("not json")),
    });

    await expect(forms.list()).rejects.toThrow("Internal Server Error");
  });
});
