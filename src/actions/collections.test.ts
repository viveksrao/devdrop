import { describe, expect, it, beforeEach, vi } from "vitest";

const mockAuth = vi.fn();
const mockCreateCollectionInDb = vi.fn();

vi.mock("@/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/db/collections", () => ({
  createCollection: mockCreateCollectionInDb,
}));

const { createCollection } = await import("./collections");

describe("createCollection action", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockCreateCollectionInDb.mockReset();
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
