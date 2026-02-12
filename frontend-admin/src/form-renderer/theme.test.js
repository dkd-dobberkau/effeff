import { describe, it, expect } from "vitest";
import { hexToRgba, buildPalette, fontFamily, DEFAULT_PALETTE, DARK_PALETTE, LIGHT_PALETTE } from "./theme";

describe("hexToRgba", () => {
  it("converts standard hex to rgba", () => {
    expect(hexToRgba("#6c5ce7", 0.25)).toBe("rgba(108, 92, 231, 0.25)");
  });

  it("converts black", () => {
    expect(hexToRgba("#000000", 1)).toBe("rgba(0, 0, 0, 1)");
  });

  it("converts white", () => {
    expect(hexToRgba("#ffffff", 0.5)).toBe("rgba(255, 255, 255, 0.5)");
  });

  it("handles zero alpha", () => {
    expect(hexToRgba("#ff0000", 0)).toBe("rgba(255, 0, 0, 0)");
  });

  it("handles alpha edge case 1", () => {
    expect(hexToRgba("#00ff00", 1)).toBe("rgba(0, 255, 0, 1)");
  });
});

describe("buildPalette", () => {
  it("returns defaults when formTheme is null", () => {
    const palette = buildPalette(null);
    expect(palette).toEqual(DEFAULT_PALETTE);
  });

  it("returns defaults when formTheme is undefined", () => {
    const palette = buildPalette(undefined);
    expect(palette).toEqual(DEFAULT_PALETTE);
  });

  it("overrides bg_color", () => {
    const palette = buildPalette({ bg_color: "#111111" });
    expect(palette.bg).toBe("#111111");
    expect(palette.accent).toBe(DEFAULT_PALETTE.accent);
  });

  it("overrides accent_color and derives hover/glow/borderFocus", () => {
    const palette = buildPalette({ accent_color: "#ff0000" });
    expect(palette.accent).toBe("#ff0000");
    expect(palette.borderFocus).toBe("#ff0000");
    expect(palette.accentGlow).toBe("rgba(255, 0, 0, 0.25)");
    // accentHover should be a lightened version
    expect(palette.accentHover).not.toBe(DEFAULT_PALETTE.accentHover);
  });

  it("preserves non-overridden defaults", () => {
    const palette = buildPalette({ bg_color: "#222222" });
    expect(palette.text).toBe(DEFAULT_PALETTE.text);
    expect(palette.textMuted).toBe(DEFAULT_PALETTE.textMuted);
    expect(palette.border).toBe(DEFAULT_PALETTE.border);
    expect(palette.success).toBe(DEFAULT_PALETTE.success);
    expect(palette.errorRed).toBe(DEFAULT_PALETTE.errorRed);
  });

  it("uses dark palette by default (no theme_mode)", () => {
    const palette = buildPalette({});
    expect(palette.bg).toBe(DARK_PALETTE.bg);
    expect(palette.text).toBe(DARK_PALETTE.text);
  });

  it("uses light palette when theme_mode is light", () => {
    const palette = buildPalette({ theme_mode: "light" });
    expect(palette.bg).toBe(LIGHT_PALETTE.bg);
    expect(palette.text).toBe(LIGHT_PALETTE.text);
    expect(palette.textMuted).toBe(LIGHT_PALETTE.textMuted);
    expect(palette.border).toBe(LIGHT_PALETTE.border);
    expect(palette.errorRed).toBe(LIGHT_PALETTE.errorRed);
  });

  it("uses dark palette when theme_mode is dark", () => {
    const palette = buildPalette({ theme_mode: "dark" });
    expect(palette.bg).toBe(DARK_PALETTE.bg);
    expect(palette.text).toBe(DARK_PALETTE.text);
  });

  it("overrides accent_color in light mode with darkened hover", () => {
    const palette = buildPalette({ theme_mode: "light", accent_color: "#ff0000" });
    expect(palette.accent).toBe("#ff0000");
    expect(palette.accentGlow).toBe("rgba(255, 0, 0, 0.15)");
    // In light mode, hover is darkened (lower values)
    expect(palette.accentHover).not.toBe(LIGHT_PALETTE.accentHover);
  });

  it("overrides bg_color in light mode", () => {
    const palette = buildPalette({ theme_mode: "light", bg_color: "#f0f0f0" });
    expect(palette.bg).toBe("#f0f0f0");
    expect(palette.text).toBe(LIGHT_PALETTE.text);
  });
});

describe("LIGHT_PALETTE", () => {
  it("has light background", () => {
    expect(LIGHT_PALETTE.bg).toBe("#ffffff");
  });

  it("has dark text", () => {
    expect(LIGHT_PALETTE.text).toBe("#1a1a2e");
  });

  it("has same accent as dark palette", () => {
    expect(LIGHT_PALETTE.accent).toBe(DARK_PALETTE.accent);
  });

  it("has lighter border", () => {
    expect(LIGHT_PALETTE.border).toBe("#e2e2ea");
  });
});

describe("fontFamily", () => {
  it("returns DM Sans as default when formTheme is null", () => {
    expect(fontFamily(null)).toBe("'DM Sans', sans-serif");
  });

  it("returns DM Sans when formTheme has no font_family", () => {
    expect(fontFamily({})).toBe("'DM Sans', sans-serif");
  });

  it("returns custom font when specified", () => {
    expect(fontFamily({ font_family: "Inter" })).toBe("'Inter', sans-serif");
  });

  it("returns DM Sans when formTheme is undefined", () => {
    expect(fontFamily(undefined)).toBe("'DM Sans', sans-serif");
  });
});
