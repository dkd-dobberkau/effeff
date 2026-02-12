import { describe, it, expect } from "vitest";
import { hexToRgba, buildPalette, fontFamily, DEFAULT_PALETTE } from "./theme";

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
