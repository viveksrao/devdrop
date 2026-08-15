"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { updateItem as updateItemInDb, deleteItem as deleteItemInDb } from "@/lib/db/items";
import type { ItemDetail } from "@/lib/db/items";

const updateItemSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().nullable().optional(),
  content: z.string().nullable().optional(),
  url: z
    .union([z.string().trim().url("Invalid URL"), z.literal("")])
    .nullable()
    .optional(),
  language: z.string().nullable().optional(),
  tags: z.array(z.string().trim().min(1)),
});

export type UpdateItemPayload = z.infer<typeof updateItemSchema>;

interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function updateItem(
  itemId: string,
  data: UpdateItemPayload
): Promise<ActionResult<ItemDetail>> {
  const parsed = updateItemSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const { title, description, content, url, language, tags } = parsed.data;

    const updated = await updateItemInDb(session.user.id, itemId, {
      title,
      description: description ?? null,
      content: content ?? null,
      url: url ? url : null,
      language: language ?? null,
      tags,
    });

    if (!updated) {
      return { success: false, error: "Item not found" };
    }

    return { success: true, data: updated };
  } catch (error) {
    console.error("Failed to update item:", error);
    return { success: false, error: "Something went wrong" };
  }
}

export async function deleteItem(itemId: string): Promise<ActionResult<null>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const deleted = await deleteItemInDb(session.user.id, itemId);

    if (!deleted) {
      return { success: false, error: "Item not found" };
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to delete item:", error);
    return { success: false, error: "Something went wrong" };
  }
}
