import { describe, expect, it, vi, beforeEach } from "vitest";

const mockAuth = vi.fn();
const mockUpdateEditorPreferencesInDb = vi.fn();

vi.mock("@/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/db/user", () => ({
  updateEditorPreferences: mockUpdateEditorPreferencesInDb,
}));

const { updateEditorPreferences } = await import("./user");

const validPreferences = {
  fontSize: 14 as const,
  tabSize: 2 as const,
  wordWrap: true,
  minimap: false,
  theme: "vs-dark" as const,
};

describe("updateEditorPreferences action", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockUpdateEditorPreferencesInDb.mockReset();
  });

  it("returns a validation error for an invalid font size", async () => {
    const result = await updateEditorPreferences({ ...validPreferences, fontSize: 999 as never });

    expect(result.success).toBe(false);
    expect(mockAuth).not.toHaveBeenCalled();
    expect(mockUpdateEditorPreferencesInDb).not.toHaveBeenCalled();
  });

  it("returns a validation error for an invalid theme", async () => {
    const result = await updateEditorPreferences({ ...validPreferences, theme: "solarized" as never });

    expect(result.success).toBe(false);
    expect(mockUpdateEditorPreferencesInDb).not.toHaveBeenCalled();
  });

  it("returns Unauthorized when there is no session", async () => {
    mockAuth.mockResolvedValueOnce(null);

    const result = await updateEditorPreferences(validPreferences);

    expect(result).toEqual({ success: false, error: "Unauthorized" });
    expect(mockUpdateEditorPreferencesInDb).not.toHaveBeenCalled();
  });

  it("saves preferences for the authenticated user", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });
    mockUpdateEditorPreferencesInDb.mockResolvedValueOnce(validPreferences);

    const result = await updateEditorPreferences(validPreferences);

    expect(result).toEqual({ success: true, data: validPreferences });
    expect(mockUpdateEditorPreferencesInDb).toHaveBeenCalledWith("user-1", validPreferences);
  });

  it("returns a generic error when the db call throws", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });
    mockUpdateEditorPreferencesInDb.mockRejectedValueOnce(new Error("db down"));

    const result = await updateEditorPreferences(validPreferences);

    expect(result).toEqual({ success: false, error: "Something went wrong" });
  });
});
