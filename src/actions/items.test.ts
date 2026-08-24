import { describe, expect, it, vi, beforeEach } from "vitest";

const mockAuth = vi.fn();
const mockUpdateItemInDb = vi.fn();
const mockDeleteItemInDb = vi.fn();
const mockCreateItemInDb = vi.fn();

vi.mock("@/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/db/items", () => ({
  updateItem: mockUpdateItemInDb,
  deleteItem: mockDeleteItemInDb,
  createItem: mockCreateItemInDb,
}));

const { updateItem, deleteItem, createItem } = await import("./items");

describe("updateItem action", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockUpdateItemInDb.mockReset();
    mockDeleteItemInDb.mockReset();
    mockCreateItemInDb.mockReset();
  });

  it("returns a validation error when title is empty", async () => {
    const result = await updateItem("item-1", {
      title: "  ",
      description: null,
      content: null,
      url: null,
      language: null,
      tags: [],
      collectionIds: [],
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
      collectionIds: [],
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
      collectionIds: [],
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
      collectionIds: [],
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
      collectionIds: ["col-1"],
    });

    expect(mockUpdateItemInDb).toHaveBeenCalledWith("user-1", "item-1", {
      title: "New title",
      description: "desc",
      content: "code",
      url: "https://example.com",
      language: "typescript",
      tags: ["a", "b"],
      collectionIds: ["col-1"],
    });
    expect(result).toEqual({ success: true, data: updated });
  });
});

describe("deleteItem action", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockUpdateItemInDb.mockReset();
    mockDeleteItemInDb.mockReset();
    mockCreateItemInDb.mockReset();
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

describe("createItem action", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockUpdateItemInDb.mockReset();
    mockDeleteItemInDb.mockReset();
    mockCreateItemInDb.mockReset();
  });

  it("returns a validation error when title is empty", async () => {
    const result = await createItem({
      itemTypeName: "snippet",
      title: "  ",
      tags: [],
      collectionIds: [],
    });

    expect(result).toEqual({ success: false, error: "Title is required" });
    expect(mockAuth).not.toHaveBeenCalled();
    expect(mockCreateItemInDb).not.toHaveBeenCalled();
  });

  it("returns a validation error for an unknown item type", async () => {
    const result = await createItem({
      // @ts-expect-error testing invalid input
      itemTypeName: "bogus",
      title: "Valid title",
      tags: [],
      collectionIds: [],
    });

    expect(result.success).toBe(false);
    expect(mockCreateItemInDb).not.toHaveBeenCalled();
  });

  it("requires a URL for link items", async () => {
    const result = await createItem({
      itemTypeName: "link",
      title: "Valid title",
      tags: [],
      collectionIds: [],
    });

    expect(result).toEqual({ success: false, error: "URL is required" });
    expect(mockCreateItemInDb).not.toHaveBeenCalled();
  });

  it("rejects an invalid URL for link items", async () => {
    const result = await createItem({
      itemTypeName: "link",
      title: "Valid title",
      url: "not-a-url",
      tags: [],
      collectionIds: [],
    });

    expect(result.success).toBe(false);
    expect(mockCreateItemInDb).not.toHaveBeenCalled();
  });

  it("returns Unauthorized when there is no session", async () => {
    mockAuth.mockResolvedValueOnce(null);

    const result = await createItem({
      itemTypeName: "snippet",
      title: "Valid title",
      tags: [],
      collectionIds: [],
    });

    expect(result).toEqual({ success: false, error: "Unauthorized" });
    expect(mockCreateItemInDb).not.toHaveBeenCalled();
  });

  it("returns an error when the item type doesn't resolve in the db", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });
    mockCreateItemInDb.mockResolvedValueOnce(null);

    const result = await createItem({
      itemTypeName: "snippet",
      title: "Valid title",
      tags: [],
      collectionIds: [],
    });

    expect(result).toEqual({ success: false, error: "Invalid item type" });
  });

  it("validates session and persists the new item", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });
    const created = { id: "item-1", title: "New snippet" };
    mockCreateItemInDb.mockResolvedValueOnce(created);

    const result = await createItem({
      itemTypeName: "snippet",
      title: "  New snippet  ",
      description: "desc",
      content: "code",
      language: "typescript",
      tags: ["a", "b"],
      collectionIds: ["col-1"],
    });

    expect(mockCreateItemInDb).toHaveBeenCalledWith("user-1", {
      itemTypeName: "snippet",
      title: "New snippet",
      description: "desc",
      content: "code",
      url: null,
      language: "typescript",
      tags: ["a", "b"],
      fileUrl: null,
      fileName: null,
      fileSize: null,
      collectionIds: ["col-1"],
    });
    expect(result).toEqual({ success: true, data: created });
  });

  it("creates a link item with a valid URL", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });
    const created = { id: "item-2", title: "Example" };
    mockCreateItemInDb.mockResolvedValueOnce(created);

    const result = await createItem({
      itemTypeName: "link",
      title: "Example",
      url: "https://example.com",
      tags: [],
      collectionIds: [],
    });

    expect(mockCreateItemInDb).toHaveBeenCalledWith("user-1", {
      itemTypeName: "link",
      title: "Example",
      description: null,
      content: null,
      url: "https://example.com",
      language: null,
      tags: [],
      fileUrl: null,
      fileName: null,
      fileSize: null,
      collectionIds: [],
    });
    expect(result).toEqual({ success: true, data: created });
  });

  it("requires a file for file/image items", async () => {
    const result = await createItem({
      itemTypeName: "image",
      title: "Screenshot",
      tags: [],
      collectionIds: [],
    });

    expect(result).toEqual({ success: false, error: "File is required" });
    expect(mockCreateItemInDb).not.toHaveBeenCalled();
  });

  it("creates an image item with file metadata", async () => {
    vi.stubEnv("R2_PUBLIC_URL", "https://files.example.com");
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });
    const created = { id: "item-3", title: "Screenshot" };
    mockCreateItemInDb.mockResolvedValueOnce(created);

    const result = await createItem({
      itemTypeName: "image",
      title: "Screenshot",
      tags: [],
      fileUrl: "https://files.example.com/user-1/abc.png",
      fileName: "screenshot.png",
      fileSize: 1024,
      collectionIds: [],
    });

    expect(mockCreateItemInDb).toHaveBeenCalledWith("user-1", {
      itemTypeName: "image",
      title: "Screenshot",
      description: null,
      content: null,
      url: null,
      language: null,
      tags: [],
      fileUrl: "https://files.example.com/user-1/abc.png",
      fileName: "screenshot.png",
      fileSize: 1024,
      collectionIds: [],
    });
    expect(result).toEqual({ success: true, data: created });
    vi.unstubAllEnvs();
  });

  it("rejects a fileUrl that isn't scoped to the current user's R2 prefix", async () => {
    vi.stubEnv("R2_PUBLIC_URL", "https://files.example.com");
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });

    const result = await createItem({
      itemTypeName: "image",
      title: "Screenshot",
      tags: [],
      fileUrl: "https://files.example.com/user-2/abc.png",
      fileName: "screenshot.png",
      fileSize: 1024,
      collectionIds: [],
    });

    expect(result).toEqual({ success: false, error: "Invalid file" });
    expect(mockCreateItemInDb).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });

  it("rejects a fileUrl pointing at an arbitrary external host", async () => {
    vi.stubEnv("R2_PUBLIC_URL", "https://files.example.com");
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });

    const result = await createItem({
      itemTypeName: "image",
      title: "Screenshot",
      tags: [],
      fileUrl: "https://internal.attacker.example/secrets",
      fileName: "screenshot.png",
      fileSize: 1024,
      collectionIds: [],
    });

    expect(result).toEqual({ success: false, error: "Invalid file" });
    expect(mockCreateItemInDb).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });
});
