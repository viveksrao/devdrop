import { describe, expect, it, beforeEach, vi } from "vitest";

const mockAuth = vi.fn();
const mockCreateCollectionInDb = vi.fn();
const mockUpdateCollectionInDb = vi.fn();
const mockDeleteCollectionInDb = vi.fn();
const mockToggleCollectionFavoriteInDb = vi.fn();

vi.mock("@/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/db/collections", () => ({
  createCollection: mockCreateCollectionInDb,
  updateCollection: mockUpdateCollectionInDb,
  deleteCollection: mockDeleteCollectionInDb,
  toggleCollectionFavorite: mockToggleCollectionFavoriteInDb,
}));

const { createCollection, updateCollection, deleteCollection, toggleCollectionFavorite } =
  await import("./collections");

describe("createCollection action", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockCreateCollectionInDb.mockReset();
    mockUpdateCollectionInDb.mockReset();
    mockDeleteCollectionInDb.mockReset();
  });

  it("returns a validation error when name is empty", async () => {
    const result = await createCollection({ name: "  " });

    expect(result).toEqual({ success: false, error: "Name is required" });
    expect(mockAuth).not.toHaveBeenCalled();
    expect(mockCreateCollectionInDb).not.toHaveBeenCalled();
  });

  it("returns Unauthorized when there is no session", async () => {
    mockAuth.mockResolvedValueOnce(null);

    const result = await createCollection({ name: "Valid name" });

    expect(result).toEqual({ success: false, error: "Unauthorized" });
    expect(mockCreateCollectionInDb).not.toHaveBeenCalled();
  });

  it("validates session and persists the new collection", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });
    const created = { id: "collection-1", name: "New collection" };
    mockCreateCollectionInDb.mockResolvedValueOnce(created);

    const result = await createCollection({
      name: "  New collection  ",
      description: "desc",
    });

    expect(mockCreateCollectionInDb).toHaveBeenCalledWith("user-1", {
      name: "New collection",
      description: "desc",
    });
    expect(result).toEqual({ success: true, data: created });
  });

  it("defaults description to null when omitted", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });
    const created = { id: "collection-2", name: "No description" };
    mockCreateCollectionInDb.mockResolvedValueOnce(created);

    const result = await createCollection({ name: "No description" });

    expect(mockCreateCollectionInDb).toHaveBeenCalledWith("user-1", {
      name: "No description",
      description: null,
    });
    expect(result).toEqual({ success: true, data: created });
  });
});

describe("updateCollection action", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockUpdateCollectionInDb.mockReset();
  });

  it("returns a validation error when name is empty", async () => {
    const result = await updateCollection("collection-1", { name: "  " });

    expect(result).toEqual({ success: false, error: "Name is required" });
    expect(mockAuth).not.toHaveBeenCalled();
    expect(mockUpdateCollectionInDb).not.toHaveBeenCalled();
  });

  it("returns Unauthorized when there is no session", async () => {
    mockAuth.mockResolvedValueOnce(null);

    const result = await updateCollection("collection-1", { name: "Valid name" });

    expect(result).toEqual({ success: false, error: "Unauthorized" });
    expect(mockUpdateCollectionInDb).not.toHaveBeenCalled();
  });

  it("returns an error when the collection is not found", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });
    mockUpdateCollectionInDb.mockResolvedValueOnce(null);

    const result = await updateCollection("collection-1", { name: "Valid name" });

    expect(result).toEqual({ success: false, error: "Collection not found" });
  });

  it("validates session and persists the updated collection", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });
    const updated = { id: "collection-1", name: "Updated name" };
    mockUpdateCollectionInDb.mockResolvedValueOnce(updated);

    const result = await updateCollection("collection-1", {
      name: "  Updated name  ",
      description: "desc",
    });

    expect(mockUpdateCollectionInDb).toHaveBeenCalledWith("user-1", "collection-1", {
      name: "Updated name",
      description: "desc",
    });
    expect(result).toEqual({ success: true, data: updated });
  });
});

describe("deleteCollection action", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockDeleteCollectionInDb.mockReset();
  });

  it("returns Unauthorized when there is no session", async () => {
    mockAuth.mockResolvedValueOnce(null);

    const result = await deleteCollection("collection-1");

    expect(result).toEqual({ success: false, error: "Unauthorized" });
    expect(mockDeleteCollectionInDb).not.toHaveBeenCalled();
  });

  it("returns an error when the collection is not found", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });
    mockDeleteCollectionInDb.mockResolvedValueOnce(false);

    const result = await deleteCollection("collection-1");

    expect(result).toEqual({ success: false, error: "Collection not found" });
  });

  it("validates session and deletes the collection", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });
    mockDeleteCollectionInDb.mockResolvedValueOnce(true);

    const result = await deleteCollection("collection-1");

    expect(mockDeleteCollectionInDb).toHaveBeenCalledWith("user-1", "collection-1");
    expect(result).toEqual({ success: true });
  });
});

describe("toggleCollectionFavorite action", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockToggleCollectionFavoriteInDb.mockReset();
  });

  it("returns Unauthorized when there is no session", async () => {
    mockAuth.mockResolvedValueOnce(null);

    const result = await toggleCollectionFavorite("collection-1");

    expect(result).toEqual({ success: false, error: "Unauthorized" });
    expect(mockToggleCollectionFavoriteInDb).not.toHaveBeenCalled();
  });

  it("returns an error when the collection is not found", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });
    mockToggleCollectionFavoriteInDb.mockResolvedValueOnce(null);

    const result = await toggleCollectionFavorite("collection-1");

    expect(result).toEqual({ success: false, error: "Collection not found" });
  });

  it("validates session and toggles the favorite state", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });
    const updated = { id: "collection-1", isFavorite: true };
    mockToggleCollectionFavoriteInDb.mockResolvedValueOnce(updated);

    const result = await toggleCollectionFavorite("collection-1");

    expect(mockToggleCollectionFavoriteInDb).toHaveBeenCalledWith("user-1", "collection-1");
    expect(result).toEqual({ success: true, data: updated });
  });
});
