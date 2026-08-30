"use server";

import { z } from "zod";
import { auth } from "@/auth";
import {
  createCollection as createCollectionInDb,
  updateCollection as updateCollectionInDb,
  deleteCollection as deleteCollectionInDb,
  toggleCollectionFavorite as toggleCollectionFavoriteInDb,
} from "@/lib/db/collections";
import type { CollectionWithStats } from "@/lib/db/collections";
import { canCreateCollection } from "@/lib/plan-limits";

const createCollectionSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string().trim().optional(),
});

export type CreateCollectionPayload = z.infer<typeof createCollectionSchema>;

const updateCollectionSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string().trim().optional(),
});

export type UpdateCollectionPayload = z.infer<typeof updateCollectionSchema>;

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

  if (!(await canCreateCollection(session.user.id, session.user.isPro))) {
    return { success: false, error: "You've reached the 3-collection limit on the free plan" };
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

export async function updateCollection(
  collectionId: string,
  data: UpdateCollectionPayload
): Promise<ActionResult<CollectionWithStats>> {
  const parsed = updateCollectionSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const { name, description } = parsed.data;

    const updated = await updateCollectionInDb(session.user.id, collectionId, {
      name,
      description: description || null,
    });

    if (!updated) {
      return { success: false, error: "Collection not found" };
    }

    return { success: true, data: updated };
  } catch (error) {
    console.error("Failed to update collection:", error);
    return { success: false, error: "Something went wrong" };
  }
}

export async function toggleCollectionFavorite(
  collectionId: string
): Promise<ActionResult<CollectionWithStats>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const updated = await toggleCollectionFavoriteInDb(session.user.id, collectionId);

    if (!updated) {
      return { success: false, error: "Collection not found" };
    }

    return { success: true, data: updated };
  } catch (error) {
    console.error("Failed to toggle collection favorite:", error);
    return { success: false, error: "Something went wrong" };
  }
}

export async function deleteCollection(collectionId: string): Promise<ActionResult<null>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const deleted = await deleteCollectionInDb(session.user.id, collectionId);

    if (!deleted) {
      return { success: false, error: "Collection not found" };
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to delete collection:", error);
    return { success: false, error: "Something went wrong" };
  }
}
