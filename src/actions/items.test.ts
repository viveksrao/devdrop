import { describe, expect, it, vi, beforeEach } from "vitest";

const mockAuth = vi.fn();
const mockUpdateItemInDb = vi.fn();
const mockDeleteItemInDb = vi.fn();

vi.mock("@/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/db/items", () => ({
  updateItem: mockUpdateItemInDb,
  deleteItem: mockDeleteItemInDb,
}));

const { updateItem, deleteItem } = await import("./items");

describe("updateItem action", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockUpdateItemInDb.mockReset();
    mockDeleteItemInDb.mockReset();
  });

  it("returns a validation error when title is empty", async () => {
    const result = await updateItem("item-1", {
      title: "  ",
      description: null,
      content: null,
      url: null,
      language: null,
      tags: [],
    });

    expect(result).toEqual({ success: false, error: "Title is required" });
    expect(mockAuth).not.toHaveBeenCalled();
    expect(mockUpdateItemInDb).not.toHaveBeenCalled();
  });

  it("returns a validation error for an invalid URL", async () => {
    const result = await updateItem("item-1", {
      title: "Valid title",
      description: null,
      content: null,
      url: "not-a-url",
      language: null,
      tags: [],
    });

    expect(result.success).toBe(false);
    expect(mockUpdateItemInDb).not.toHaveBeenCalled();
  });

  it("returns Unauthorized when there is no session", async () => {
    mockAuth.mockResolvedValueOnce(null);

    const result = await updateItem("item-1", {
      title: "Valid title",
      description: null,
      content: null,
      url: null,
      language: null,
      tags: [],
    });

    expect(result).toEqual({ success: false, error: "Unauthorized" });
    expect(mockUpdateItemInDb).not.toHaveBeenCalled();
  });

  it("returns an error when the item isn't found or owned by another user", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });
    mockUpdateItemInDb.mockResolvedValueOnce(null);

    const result = await updateItem("item-404", {
      title: "Valid title",
      description: null,
      content: null,
      url: null,
      language: null,
      tags: [],
    });

    expect(result).toEqual({ success: false, error: "Item not found" });
  });

  it("validates ownership via session and persists the update", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });
    const updated = { id: "item-1", title: "New title" };
    mockUpdateItemInDb.mockResolvedValueOnce(updated);

    const result = await updateItem("item-1", {
      title: "  New title  ",
      description: "desc",
      content: "code",
      url: "https://example.com",
      language: "typescript",
      tags: ["a", "b"],
    });

    expect(mockUpdateItemInDb).toHaveBeenCalledWith("user-1", "item-1", {
      title: "New title",
      description: "desc",
      content: "code",
      url: "https://example.com",
      language: "typescript",
      tags: ["a", "b"],
    });
    expect(result).toEqual({ success: true, data: updated });
  });
});

describe("deleteItem action", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockUpdateItemInDb.mockReset();
    mockDeleteItemInDb.mockReset();
  });

  it("returns Unauthorized when there is no session", async () => {
    mockAuth.mockResolvedValueOnce(null);

    const result = await deleteItem("item-1");

    expect(result).toEqual({ success: false, error: "Unauthorized" });
    expect(mockDeleteItemInDb).not.toHaveBeenCalled();
  });

  it("returns an error when the item isn't found or owned by another user", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });
    mockDeleteItemInDb.mockResolvedValueOnce(false);

    const result = await deleteItem("item-404");

    expect(result).toEqual({ success: false, error: "Item not found" });
  });

  it("validates ownership via session and deletes the item", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });
    mockDeleteItemInDb.mockResolvedValueOnce(true);

    const result = await deleteItem("item-1");

    expect(mockDeleteItemInDb).toHaveBeenCalledWith("user-1", "item-1");
    expect(result).toEqual({ success: true });
  });
});
