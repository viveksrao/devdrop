import { describe, expect, it } from "vitest";
import { prismaMock } from "@/lib/__mocks__/prisma";
import { getItemStats } from "./items";

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
