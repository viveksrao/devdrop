"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner";
import { updateEditorPreferences } from "@/actions/user";
import {
  DEFAULT_EDITOR_PREFERENCES,
  parseEditorPreferences,
  type EditorPreferences,
} from "@/lib/constants/editor-preferences";

interface EditorPreferencesContextValue {
  preferences: EditorPreferences;
  setPreferences: (preferences: EditorPreferences) => void;
}

const EditorPreferencesContext = createContext<EditorPreferencesContextValue | null>(null);

export function useEditorPreferences(): EditorPreferencesContextValue {
  const context = useContext(EditorPreferencesContext);
  if (!context) {
    throw new Error("useEditorPreferences must be used within an EditorPreferencesProvider");
  }
  return context;
}

export function EditorPreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferencesState] = useState<EditorPreferences>(
    DEFAULT_EDITOR_PREFERENCES
  );

  useEffect(() => {
    let cancelled = false;

    fetch("/api/user/editor-preferences")
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled && json.success) {
          setPreferencesState(parseEditorPreferences(json.data));
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  function setPreferences(next: EditorPreferences) {
    setPreferencesState(next);
    updateEditorPreferences(next).then((result) => {
      if (result.success) {
        toast.success("Editor preferences saved");
      } else {
        toast.error(result.error ?? "Failed to save editor preferences");
      }
    });
  }

  return (
    <EditorPreferencesContext.Provider value={{ preferences, setPreferences }}>
      {children}
    </EditorPreferencesContext.Provider>
  );
}
