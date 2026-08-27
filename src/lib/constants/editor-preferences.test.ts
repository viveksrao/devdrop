import { describe, expect, it } from "vitest";
import { DEFAULT_EDITOR_PREFERENCES, parseEditorPreferences } from "./editor-preferences";

describe("parseEditorPreferences", () => {
  it("returns defaults when value is null or not an object", () => {
    expect(parseEditorPreferences(null)).toEqual(DEFAULT_EDITOR_PREFERENCES);
    expect(parseEditorPreferences(undefined)).toEqual(DEFAULT_EDITOR_PREFERENCES);
    expect(parseEditorPreferences("nope")).toEqual(DEFAULT_EDITOR_PREFERENCES);
  });

  it("returns a fully valid object unchanged", () => {
    const valid = {
      fontSize: 16,
      tabSize: 4,
      wordWrap: false,
      minimap: true,
      theme: "monokai",
    };

    expect(parseEditorPreferences(valid)).toEqual(valid);
  });

  it("falls back to defaults field-by-field for invalid values", () => {
    const partiallyInvalid = {
      fontSize: 999,
      tabSize: 4,
      wordWrap: "yes",
      minimap: true,
      theme: "solarized",
    };

    expect(parseEditorPreferences(partiallyInvalid)).toEqual({
      fontSize: DEFAULT_EDITOR_PREFERENCES.fontSize,
      tabSize: 4,
      wordWrap: DEFAULT_EDITOR_PREFERENCES.wordWrap,
      minimap: true,
      theme: DEFAULT_EDITOR_PREFERENCES.theme,
    });
  });
});
