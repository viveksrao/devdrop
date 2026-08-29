import { describe, expect, it } from "vitest";
import { prismaMock } from "@/lib/__mocks__/prisma";
import { canCreateItem, canCreateCollection } from "./plan-limits";

describe("canCreateItem", () => {
  it("returns true for Pro users without querying the DB", async () => {
    const result = await canCreateItem("user-1", true);

    expect(result).toBe(true);
    expect(prismaMock.item.count).not.toHaveBeenCalled();
  });

  it("returns true for a free user under the limit (49 items)", async () => {
    prismaMock.item.count.mockResolvedValueOnce(49);

    const result = await canCreateItem("user-1", false);

    expect(result).toBe(true);
    expect(prismaMock.item.count).toHaveBeenCalledWith({ where: { userId: "user-1" } });
  });

  it("returns false for a free user at the limit (50 items)", async () => {
    prismaMock.item.count.mockResolvedValueOnce(50);

    const result = await canCreateItem("user-1", false);

    expect(result).toBe(false);
  });
});

describe("canCreateCollection", () => {
  it("returns true for Pro users without querying the DB", async () => {
    const result = await canCreateCollection("user-1", true);

    expect(result).toBe(true);
    expect(prismaMock.collection.count).not.toHaveBeenCalled();
  });

  it("returns true for a free user under the limit (2 collections)", async () => {
    prismaMock.collection.count.mockResolvedValueOnce(2);

    const result = await canCreateCollection("user-1", false);

    expect(result).toBe(true);
    expect(prismaMock.collection.count).toHaveBeenCalledWith({ where: { userId: "user-1" } });
  });

  it("returns false for a free user at the limit (3 collections)", async () => {
    prismaMock.collection.count.mockResolvedValueOnce(3);

    const result = await canCreateCollection("user-1", false);

    expect(result).toBe(false);
  });
});
