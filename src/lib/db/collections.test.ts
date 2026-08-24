import { describe, expect, it } from "vitest";
import { prismaMock } from "@/lib/__mocks__/prisma";
import { createCollection } from "./collections";

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
