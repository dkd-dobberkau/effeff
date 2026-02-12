import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import useFormApi from "./useFormApi";

describe("useFormApi", () => {
  it("starts with loading=true and data=null", () => {
    const fetchFn = vi.fn(() => new Promise(() => {})); // never resolves
    const { result } = renderHook(() => useFormApi(fetchFn));

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("sets data on successful fetch", async () => {
    const mockData = [{ id: "form:1" }];
    const fetchFn = vi.fn(() => Promise.resolve(mockData));
    const { result } = renderHook(() => useFormApi(fetchFn));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBeNull();
  });

  it("sets error on failed fetch", async () => {
    const fetchFn = vi.fn(() => Promise.reject(new Error("Network error")));
    const { result } = renderHook(() => useFormApi(fetchFn));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe("Network error");
  });

  it("refetch resets and re-fetches data", async () => {
    let callCount = 0;
    const fetchFn = vi.fn(() => {
      callCount++;
      return Promise.resolve({ count: callCount });
    });

    const { result } = renderHook(() => useFormApi(fetchFn));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual({ count: 1 });

    // Trigger refetch
    result.current.refetch();

    await waitFor(() => {
      expect(result.current.data).toEqual({ count: 2 });
    });

    expect(fetchFn).toHaveBeenCalledTimes(2);
  });
});
