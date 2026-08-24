"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { createCollection as createCollectionInDb } from "@/lib/db/collections";
import type { CollectionWithStats } from "@/lib/db/collections";

const createCollectionSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string().trim().optional(),
});

export type CreateCollectionPayload = z.infer<typeof createCollectionSchema>;

interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function createCollection(
  data: CreateCollectionPayload
): Promise<ActionResult<CollectionWithStats>> {
  const parsed = createCollectionSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const { name, description } = parsed.data;

    const created = await createCollectionInDb(session.user.id, {
      name,
      description: description || null,
    });

    return { success: true, data: created };
  } catch (error) {
    console.error("Failed to create collection:", error);
    return { success: false, error: "Something went wrong" };
  }
}
