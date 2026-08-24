import { describe, expect, it } from "vitest";
import { prismaMock } from "@/lib/__mocks__/prisma";
import { createCollection, getAllCollections } from "./collections";

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
