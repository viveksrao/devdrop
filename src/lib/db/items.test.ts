import { describe, expect, it, vi, beforeEach } from "vitest";
import { prismaMock } from "@/lib/__mocks__/prisma";
import {
  createItem,
  deleteItem,
  getItemDetail,
  getItemsByType,
  getItemStats,
  updateItem,
} from "./items";

const mockDeleteFileFromR2 = vi.fn();

vi.mock("@/lib/r2", () => ({
  deleteFileFromR2: (...args: unknown[]) => mockDeleteFileFromR2(...args),
  getR2KeyFromUrl: (fileUrl: string) => fileUrl.replace("https://files.example.com/", ""),
}));

beforeEach(() => {
  mockDeleteFileFromR2.mockReset();
});

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

describe("getItemsByType", () => {
  it("paginates via skip/take and returns the total count for the type", async () => {
    const item = {
      id: "item-1",
      title: "useAuth hook",
      description: null,
      contentType: "TEXT" as const,
      fileUrl: null,
      fileName: null,
      fileSize: null,
      createdAt: new Date("2026-01-01T00:00:00Z"),
      updatedAt: new Date("2026-01-01T00:00:00Z"),
      isFavorite: false,
      isPinned: false,
      tags: [],
      itemType: { id: "type-1", name: "snippet", icon: "Code", color: "#3b82f6" },
    };
    prismaMock.item.findMany.mockResolvedValueOnce([item]);
    prismaMock.item.count.mockResolvedValueOnce(45);

    const result = await getItemsByType("user-1", "snippet", 3, 21);

    const where = { userId: "user-1", itemType: { name: "snippet" } };
    expect(prismaMock.item.findMany).toHaveBeenCalledWith({
      where,
      orderBy: { createdAt: "desc" },
      skip: 42,
      take: 21,
      include: { itemType: true, tags: true },
    });
    expect(prismaMock.item.count).toHaveBeenCalledWith({ where });
    expect(result).toEqual({
      items: [
        {
          id: "item-1",
          title: "useAuth hook",
          description: null,
          contentType: "TEXT",
          fileUrl: null,
          fileName: null,
          fileSize: null,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          isFavorite: false,
          isPinned: false,
          tags: [],
          itemType: item.itemType,
        },
      ],
      totalCount: 45,
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
      collectionIds: [],
    });

    expect(result).toBeNull();
    expect(prismaMock.item.update).not.toHaveBeenCalled();
  });

  it("updates the item's fields, replaces its tags, and scopes collections to the owner", async () => {
    prismaMock.item.findFirst.mockResolvedValueOnce({ id: "item-1" } as never);
    prismaMock.collection.findMany.mockResolvedValueOnce([{ id: "col-1" }] as never);
    prismaMock.item.update.mockResolvedValueOnce(updatedItem);

    const result = await updateItem("user-1", "item-1", {
      title: "Updated title",
      description: "Updated description",
      content: "console.log('updated')",
      url: null,
      language: "javascript",
      tags: ["react"],
      collectionIds: ["col-1", "col-not-owned"],
    });

    expect(prismaMock.collection.findMany).toHaveBeenCalledWith({
      where: { id: { in: ["col-1", "col-not-owned"] }, userId: "user-1" },
      select: { id: true },
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
        collections: {
          deleteMany: {},
          create: [{ collectionId: "col-1" }],
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

describe("createItem", () => {
  const createdItem = {
    id: "item-1",
    title: "useAuth hook",
    description: "Custom hook",
    contentType: "TEXT" as const,
    content: "export function useAuth() {}",
    fileUrl: null,
    fileName: null,
    fileSize: null,
    url: null,
    language: "typescript",
    isFavorite: false,
    isPinned: false,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    itemType: { id: "type-1", name: "snippet", icon: "Code", color: "#3b82f6" },
    tags: [{ name: "react" }],
    collections: [],
  };

  it("returns null when the item type doesn't exist or isn't a system type", async () => {
    prismaMock.itemType.findFirst.mockResolvedValueOnce(null);

    const result = await createItem("user-1", {
      itemTypeName: "bogus",
      title: "Title",
      description: null,
      content: null,
      url: null,
      language: null,
      tags: [],
      fileUrl: null,
      fileName: null,
      fileSize: null,
      collectionIds: [],
    });

    expect(result).toBeNull();
    expect(prismaMock.item.create).not.toHaveBeenCalled();
  });

  it("creates a TEXT item scoped to the user, resolving the type by name and owned collections", async () => {
    prismaMock.itemType.findFirst.mockResolvedValueOnce({
      id: "type-1",
      name: "snippet",
      icon: "Code",
      color: "#3b82f6",
      isSystem: true,
      userId: null,
    });
    prismaMock.collection.findMany.mockResolvedValueOnce([{ id: "col-1" }] as never);
    prismaMock.item.create.mockResolvedValueOnce(createdItem);

    const result = await createItem("user-1", {
      itemTypeName: "snippet",
      title: "useAuth hook",
      description: "Custom hook",
      content: "export function useAuth() {}",
      url: null,
      language: "typescript",
      tags: ["react"],
      fileUrl: null,
      fileName: null,
      fileSize: null,
      collectionIds: ["col-1", "col-not-owned"],
    });

    expect(prismaMock.itemType.findFirst).toHaveBeenCalledWith({
      where: { name: "snippet", isSystem: true },
    });
    expect(prismaMock.collection.findMany).toHaveBeenCalledWith({
      where: { id: { in: ["col-1", "col-not-owned"] }, userId: "user-1" },
      select: { id: true },
    });
    expect(prismaMock.item.create).toHaveBeenCalledWith({
      data: {
        title: "useAuth hook",
        description: "Custom hook",
        contentType: "TEXT",
        content: "export function useAuth() {}",
        url: null,
        language: "typescript",
        fileUrl: null,
        fileName: null,
        fileSize: null,
        userId: "user-1",
        itemTypeId: "type-1",
        tags: {
          connectOrCreate: [{ where: { name: "react" }, create: { name: "react" } }],
        },
        collections: {
          create: [{ collectionId: "col-1" }],
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
      title: "useAuth hook",
      description: "Custom hook",
      contentType: "TEXT",
      content: "export function useAuth() {}",
      fileUrl: null,
      fileName: null,
      fileSize: null,
      url: null,
      language: "typescript",
      isFavorite: false,
      isPinned: false,
      createdAt: createdItem.createdAt,
      updatedAt: createdItem.updatedAt,
      tags: ["react"],
      itemType: createdItem.itemType,
      collections: [],
    });
  });

  it("uses URL contentType for the link type", async () => {
    prismaMock.itemType.findFirst.mockResolvedValueOnce({
      id: "type-link",
      name: "link",
      icon: "Link",
      color: "#10b981",
      isSystem: true,
      userId: null,
    });
    prismaMock.collection.findMany.mockResolvedValueOnce([]);
    prismaMock.item.create.mockResolvedValueOnce({
      ...createdItem,
      contentType: "URL",
      content: null,
      url: "https://example.com",
      itemType: { id: "type-link", name: "link", icon: "Link", color: "#10b981" },
    });

    await createItem("user-1", {
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

    expect(prismaMock.item.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ contentType: "URL", url: "https://example.com" }),
      })
    );
  });

  it("uses FILE contentType and stores file fields for the image type", async () => {
    prismaMock.itemType.findFirst.mockResolvedValueOnce({
      id: "type-image",
      name: "image",
      icon: "Image",
      color: "#ec4899",
      isSystem: true,
      userId: null,
    });
    prismaMock.collection.findMany.mockResolvedValueOnce([]);
    prismaMock.item.create.mockResolvedValueOnce({
      ...createdItem,
      contentType: "FILE",
      content: null,
      fileUrl: "https://files.example.com/user-1/abc.png",
      fileName: "screenshot.png",
      fileSize: 1024,
      itemType: { id: "type-image", name: "image", icon: "Image", color: "#ec4899" },
    });

    await createItem("user-1", {
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

    expect(prismaMock.item.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          contentType: "FILE",
          fileUrl: "https://files.example.com/user-1/abc.png",
          fileName: "screenshot.png",
          fileSize: 1024,
        }),
      })
    );
  });
});

describe("deleteItem", () => {
  it("returns false when the item doesn't exist or belongs to another user", async () => {
    prismaMock.item.findFirst.mockResolvedValueOnce(null);

    const result = await deleteItem("user-1", "item-404");

    expect(result).toBe(false);
    expect(prismaMock.item.delete).not.toHaveBeenCalled();
  });

  it("deletes the item when owned by the requesting user", async () => {
    prismaMock.item.findFirst.mockResolvedValueOnce({
      id: "item-1",
      contentType: "TEXT",
      fileUrl: null,
    } as never);
    prismaMock.item.delete.mockResolvedValueOnce({ id: "item-1" } as never);

    const result = await deleteItem("user-1", "item-1");

    expect(prismaMock.item.findFirst).toHaveBeenCalledWith({
      where: { id: "item-1", userId: "user-1" },
    });
    expect(prismaMock.item.delete).toHaveBeenCalledWith({ where: { id: "item-1" } });
    expect(mockDeleteFileFromR2).not.toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it("deletes the R2 object when the item is a FILE type", async () => {
    prismaMock.item.findFirst.mockResolvedValueOnce({
      id: "item-2",
      contentType: "FILE",
      fileUrl: "https://files.example.com/user-1/abc.png",
    } as never);
    prismaMock.item.delete.mockResolvedValueOnce({ id: "item-2" } as never);

    const result = await deleteItem("user-1", "item-2");

    expect(mockDeleteFileFromR2).toHaveBeenCalledWith("user-1/abc.png");
    expect(result).toBe(true);
  });
});
