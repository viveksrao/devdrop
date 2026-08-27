export const EDITOR_THEMES = ["vs-dark", "monokai", "github-dark"] as const;
export type EditorTheme = (typeof EDITOR_THEMES)[number];

export const FONT_SIZES = [12, 13, 14, 16, 18, 20] as const;
export type FontSize = (typeof FONT_SIZES)[number];

export const TAB_SIZES = [2, 4, 8] as const;
export type TabSize = (typeof TAB_SIZES)[number];

export interface EditorPreferences {
  fontSize: FontSize;
  tabSize: TabSize;
  wordWrap: boolean;
  minimap: boolean;
  theme: EditorTheme;
}

export const DEFAULT_EDITOR_PREFERENCES: EditorPreferences = {
  fontSize: 13,
  tabSize: 2,
  wordWrap: true,
  minimap: false,
  theme: "vs-dark",
};

export function parseEditorPreferences(value: unknown): EditorPreferences {
  if (!value || typeof value !== "object") return DEFAULT_EDITOR_PREFERENCES;

  const raw = value as Partial<EditorPreferences>;

  return {
    fontSize: FONT_SIZES.includes(raw.fontSize as FontSize)
      ? (raw.fontSize as FontSize)
      : DEFAULT_EDITOR_PREFERENCES.fontSize,
    tabSize: TAB_SIZES.includes(raw.tabSize as TabSize)
      ? (raw.tabSize as TabSize)
      : DEFAULT_EDITOR_PREFERENCES.tabSize,
    wordWrap: typeof raw.wordWrap === "boolean" ? raw.wordWrap : DEFAULT_EDITOR_PREFERENCES.wordWrap,
    minimap: typeof raw.minimap === "boolean" ? raw.minimap : DEFAULT_EDITOR_PREFERENCES.minimap,
    theme: EDITOR_THEMES.includes(raw.theme as EditorTheme)
      ? (raw.theme as EditorTheme)
      : DEFAULT_EDITOR_PREFERENCES.theme,
  };
}
