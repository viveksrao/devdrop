"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { updateEditorPreferences as updateEditorPreferencesInDb } from "@/lib/db/user";
import { EDITOR_THEMES, FONT_SIZES, TAB_SIZES } from "@/lib/constants/editor-preferences";
import type { EditorPreferences } from "@/lib/constants/editor-preferences";

const editorPreferencesSchema = z.object({
  fontSize: z.union(FONT_SIZES.map((size) => z.literal(size))),
  tabSize: z.union(TAB_SIZES.map((size) => z.literal(size))),
  wordWrap: z.boolean(),
  minimap: z.boolean(),
  theme: z.enum(EDITOR_THEMES),
});

interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function updateEditorPreferences(
  data: EditorPreferences
): Promise<ActionResult<EditorPreferences>> {
  const parsed = editorPreferencesSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const updated = await updateEditorPreferencesInDb(session.user.id, parsed.data);
    return { success: true, data: updated };
  } catch (error) {
    console.error("Failed to update editor preferences:", error);
    return { success: false, error: "Something went wrong" };
  }
}
