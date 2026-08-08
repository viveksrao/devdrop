import { describe, expect, it } from "vitest";
import { prismaMock } from "@/lib/__mocks__/prisma";
import { getItemDetail, getItemStats, updateItem } from "./items";

describe("getItemStats", () => {
  it("returns total and favorite item counts for a user", async () => {
    prismaMock.item.count.mockResolvedValueOnce(12).mockResolvedValueOnce(3);

    const stats = await getItemStats("user-1");

    expect(stats).toEqual({ totalItems: 12, favoriteItems: 3 });
    expect(prismaMock.item.count).toHaveBeenNthCalledWith(1, { where: { userId: "user-1" } });
    expect(prismaMock.item.count).toHaveBeenNthCalledWith(2, {
      where: { userId: "user-1", isFavorite: true },
    });
  });
});

describe("getItemDetail", () => {
  const baseItem = {
    id: "item-1",
    title: "useAuth hook",
    description: "Custom hook wrapping session + user state",
    contentType: "TEXT" as const,
    content: "export function useAuth() {}",
    fileUrl: null,
    fileName: null,
    fileSize: null,
    url: null,
    language: "typescript",
    isFavorite: true,
    isPinned: false,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-02T00:00:00Z"),
    itemType: { id: "type-1", name: "snippet", icon: "Code", color: "#3b82f6" },
    tags: [{ name: "react" }, { name: "auth" }],
    collections: [
      { collection: { id: "col-1", name: "React Patterns" } },
    ],
  };

  it("scopes the lookup to the requesting user and shapes the result", async () => {
    prismaMock.item.findFirst.mockResolvedValueOnce(baseItem);

    const detail = await getItemDetail("user-1", "item-1");

    expect(prismaMock.item.findFirst).toHaveBeenCalledWith({
      where: { id: "item-1", userId: "user-1" },
      include: {
        itemType: true,
        tags: true,
        collections: { include: { collection: true } },
      },
    });
    expect(detail).toEqual({
      id: "item-1",
      title: "useAuth hook",
      description: "Custom hook wrapping session + user state",
      contentType: "TEXT",
      content: "export function useAuth() {}",
      fileUrl: null,
      fileName: null,
      fileSize: null,
      url: null,
      language: "typescript",
      isFavorite: true,
      isPinned: false,
      createdAt: baseItem.createdAt,
      updatedAt: baseItem.updatedAt,
      tags: ["react", "auth"],
      itemType: baseItem.itemType,
      collections: [{ id: "col-1", name: "React Patterns" }],
    });
  });

  it("returns null when the item doesn't exist or belongs to another user", async () => {
    prismaMock.item.findFirst.mockResolvedValueOnce(null);

    const detail = await getItemDetail("user-1", "item-404");

    expect(detail).toBeNull();
  });
});

describe("updateItem", () => {
  const updatedItem = {
    id: "item-1",
    title: "Updated title",
    description: "Updated description",
    contentType: "TEXT" as const,
    content: "console.log('updated')",
    fileUrl: null,
    fileName: null,
    fileSize: null,
    url: null,
    language: "javascript",
    isFavorite: false,
    isPinned: false,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-03T00:00:00Z"),
    itemType: { id: "type-1", name: "snippet", icon: "Code", color: "#3b82f6" },
    tags: [{ name: "react" }],
    collections: [],
  };

  it("returns null when the item doesn't exist or belongs to another user", async () => {
    prismaMock.item.findFirst.mockResolvedValueOnce(null);

    const result = await updateItem("user-1", "item-404", {
      title: "New title",
      description: null,
      content: null,
      url: null,
      language: null,
      tags: [],
    });

    expect(result).toBeNull();
    expect(prismaMock.item.update).not.toHaveBeenCalled();
  });

  it("updates the item's fields and replaces its tags", async () => {
    prismaMock.item.findFirst.mockResolvedValueOnce({ id: "item-1" } as never);
    prismaMock.item.update.mockResolvedValueOnce(updatedItem);

    const result = await updateItem("user-1", "item-1", {
      title: "Updated title",
      description: "Updated description",
      content: "console.log('updated')",
      url: null,
      language: "javascript",
      tags: ["react"],
    });

    expect(prismaMock.item.update).toHaveBeenCalledWith({
      where: { id: "item-1" },
      data: {
        title: "Updated title",
        description: "Updated description",
        content: "console.log('updated')",
        url: null,
        language: "javascript",
        tags: {
          set: [],
          connectOrCreate: [{ where: { name: "react" }, create: { name: "react" } }],
        },
      },
      include: {
        itemType: true,
        tags: true,
        collections: { include: { collection: true } },
      },
    });
    expect(result).toEqual({
      id: "item-1",
      title: "Updated title",
      description: "Updated description",
      contentType: "TEXT",
      content: "console.log('updated')",
      fileUrl: null,
      fileName: null,
      fileSize: null,
      url: null,
      language: "javascript",
      isFavorite: false,
      isPinned: false,
      createdAt: updatedItem.createdAt,
      updatedAt: updatedItem.updatedAt,
      tags: ["react"],
      itemType: updatedItem.itemType,
      collections: [],
    });
  });
});
