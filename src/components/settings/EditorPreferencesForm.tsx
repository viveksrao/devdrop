"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEditorPreferences } from "@/components/dashboard/EditorPreferencesProvider";
import {
  EDITOR_THEMES,
  FONT_SIZES,
  TAB_SIZES,
  type EditorTheme,
  type FontSize,
  type TabSize,
} from "@/lib/constants/editor-preferences";

const THEME_LABELS: Record<EditorTheme, string> = {
  "vs-dark": "VS Dark",
  monokai: "Monokai",
  "github-dark": "GitHub Dark",
};

export function EditorPreferencesForm() {
  const { preferences, setPreferences } = useEditorPreferences();

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-4">
        <Label htmlFor="editor-font-size">Font size</Label>
        <Select
          value={String(preferences.fontSize)}
          onValueChange={(value) =>
            setPreferences({ ...preferences, fontSize: Number(value) as FontSize })
          }
        >
          <SelectTrigger id="editor-font-size" className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FONT_SIZES.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size}px
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between gap-4">
        <Label htmlFor="editor-tab-size">Tab size</Label>
        <Select
          value={String(preferences.tabSize)}
          onValueChange={(value) =>
            setPreferences({ ...preferences, tabSize: Number(value) as TabSize })
          }
        >
          <SelectTrigger id="editor-tab-size" className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TAB_SIZES.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size} spaces
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between gap-4">
        <Label htmlFor="editor-theme">Theme</Label>
        <Select
          value={preferences.theme}
          onValueChange={(value) =>
            setPreferences({ ...preferences, theme: value as EditorTheme })
          }
        >
          <SelectTrigger id="editor-theme" className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {EDITOR_THEMES.map((theme) => (
              <SelectItem key={theme} value={theme}>
                {THEME_LABELS[theme]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between gap-4">
        <Label htmlFor="editor-word-wrap">Word wrap</Label>
        <Switch
          id="editor-word-wrap"
          checked={preferences.wordWrap}
          onCheckedChange={(checked) => setPreferences({ ...preferences, wordWrap: checked })}
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        <Label htmlFor="editor-minimap">Minimap</Label>
        <Switch
          id="editor-minimap"
          checked={preferences.minimap}
          onCheckedChange={(checked) => setPreferences({ ...preferences, minimap: checked })}
        />
      </div>
    </div>
  );
}
