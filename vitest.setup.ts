import { beforeEach, vi } from "vitest";
import { prismaMock, resetPrismaMock } from "@/lib/__mocks__/prisma";

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

beforeEach(() => {
  resetPrismaMock();
});
