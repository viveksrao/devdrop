import { describe, expect, it } from "vitest";
import { prismaMock } from "@/lib/__mocks__/prisma";
import {
  createCollection,
  getAllCollections,
  updateCollection,
  deleteCollection,
} from "./collections";

describe("createCollection", () => {
  it("creates a user-scoped collection and returns it with empty stats", async () => {
    const createdCollection = {
      id: "collection-1",
      name: "React Patterns",
      description: "Reusable hooks and patterns",
      isFavorite: false,
      userId: "user-1",
      defaultTypeId: null,
      createdAt: new Date("2026-01-01T00:00:00Z"),
      updatedAt: new Date("2026-01-01T00:00:00Z"),
    };
    prismaMock.collection.create.mockResolvedValueOnce(createdCollection);

    const result = await createCollection("user-1", {
      name: "React Patterns",
      description: "Reusable hooks and patterns",
    });

    expect(prismaMock.collection.create).toHaveBeenCalledWith({
      data: {
        name: "React Patterns",
        description: "Reusable hooks and patterns",
        userId: "user-1",
      },
    });
    expect(result).toEqual({
      id: "collection-1",
      name: "React Patterns",
      description: "Reusable hooks and patterns",
      isFavorite: false,
      itemCount: 0,
      types: [],
      dominantColor: null,
    });
  });
});

describe("getAllCollections", () => {
  it("returns id/name pairs for the user's collections, ordered by name", async () => {
    const collections = [
      { id: "col-1", name: "AI Workflows" },
      { id: "col-2", name: "React Patterns" },
    ];
    prismaMock.collection.findMany.mockResolvedValueOnce(collections as never);

    const result = await getAllCollections("user-1");

    expect(prismaMock.collection.findMany).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });
    expect(result).toEqual(collections);
  });
});

describe("updateCollection", () => {
  it("returns null when the collection is not found or not owned by the user", async () => {
    prismaMock.collection.findFirst.mockResolvedValueOnce(null);

    const result = await updateCollection("user-1", "collection-1", {
      name: "New name",
      description: null,
    });

    expect(prismaMock.collection.findFirst).toHaveBeenCalledWith({
      where: { id: "collection-1", userId: "user-1" },
    });
    expect(prismaMock.collection.update).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it("updates a user-owned collection's name and description", async () => {
    prismaMock.collection.findFirst.mockResolvedValueOnce({
      id: "collection-1",
      name: "Old name",
      description: null,
      isFavorite: false,
      userId: "user-1",
      defaultTypeId: null,
      createdAt: new Date("2026-01-01T00:00:00Z"),
      updatedAt: new Date("2026-01-01T00:00:00Z"),
    });
    prismaMock.collection.update.mockResolvedValueOnce({
      id: "collection-1",
      name: "New name",
      description: "New description",
      isFavorite: false,
      items: [],
    } as never);

    const result = await updateCollection("user-1", "collection-1", {
      name: "New name",
      description: "New description",
    });

    expect(prismaMock.collection.update).toHaveBeenCalledWith({
      where: { id: "collection-1" },
      data: { name: "New name", description: "New description" },
      select: expect.any(Object),
    });
    expect(result).toEqual({
      id: "collection-1",
      name: "New name",
      description: "New description",
      isFavorite: false,
      itemCount: 0,
      types: [],
      dominantColor: null,
    });
  });
});

describe("deleteCollection", () => {
  it("returns false when the collection is not found or not owned by the user", async () => {
    prismaMock.collection.findFirst.mockResolvedValueOnce(null);

    const result = await deleteCollection("user-1", "collection-1");

    expect(prismaMock.collection.delete).not.toHaveBeenCalled();
    expect(result).toBe(false);
  });

  it("deletes a user-owned collection", async () => {
    prismaMock.collection.findFirst.mockResolvedValueOnce({
      id: "collection-1",
      name: "React Patterns",
      description: null,
      isFavorite: false,
      userId: "user-1",
      defaultTypeId: null,
      createdAt: new Date("2026-01-01T00:00:00Z"),
      updatedAt: new Date("2026-01-01T00:00:00Z"),
    });
    prismaMock.collection.delete.mockResolvedValueOnce({} as never);

    const result = await deleteCollection("user-1", "collection-1");

    expect(prismaMock.collection.delete).toHaveBeenCalledWith({
      where: { id: "collection-1" },
    });
    expect(result).toBe(true);
  });
});
