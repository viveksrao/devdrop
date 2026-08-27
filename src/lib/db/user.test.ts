import { describe, expect, it } from "vitest";
import { prismaMock } from "@/lib/__mocks__/prisma";
import { getEditorPreferences, updateEditorPreferences } from "./user";
import { DEFAULT_EDITOR_PREFERENCES } from "@/lib/constants/editor-preferences";

describe("getEditorPreferences", () => {
  it("returns parsed preferences when the user has saved values", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({
      editorPreferences: {
        fontSize: 16,
        tabSize: 4,
        wordWrap: false,
        minimap: true,
        theme: "github-dark",
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    const preferences = await getEditorPreferences("user-1");

    expect(preferences).toEqual({
      fontSize: 16,
      tabSize: 4,
      wordWrap: false,
      minimap: true,
      theme: "github-dark",
    });
  });

  it("returns defaults when the user has no saved preferences", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    prismaMock.user.findUnique.mockResolvedValueOnce({ editorPreferences: null } as any);

    const preferences = await getEditorPreferences("user-1");

    expect(preferences).toEqual(DEFAULT_EDITOR_PREFERENCES);
  });

  it("returns defaults when the user is not found", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(null);

    const preferences = await getEditorPreferences("missing-user");

    expect(preferences).toEqual(DEFAULT_EDITOR_PREFERENCES);
  });
});

describe("updateEditorPreferences", () => {
  it("persists and returns the parsed updated preferences", async () => {
    const next = {
      fontSize: 18,
      tabSize: 2,
      wordWrap: true,
      minimap: false,
      theme: "monokai" as const,
    };

    prismaMock.user.update.mockResolvedValueOnce({
      editorPreferences: next,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    const result = await updateEditorPreferences("user-1", next);

    expect(result).toEqual(next);
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { editorPreferences: next },
      select: { editorPreferences: true },
    });
  });
});
