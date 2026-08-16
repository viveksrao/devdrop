"use server";

import { z } from "zod";
import { auth } from "@/auth";
import {
  updateItem as updateItemInDb,
  deleteItem as deleteItemInDb,
  createItem as createItemInDb,
} from "@/lib/db/items";
import type { ItemDetail } from "@/lib/db/items";

const CREATABLE_ITEM_TYPES = [
  "snippet",
  "prompt",
  "command",
  "note",
  "link",
  "file",
  "image",
] as const;

const FILE_ITEM_TYPES = new Set(["file", "image"]);

const createItemSchema = z
  .object({
    itemTypeName: z.enum(CREATABLE_ITEM_TYPES),
    title: z.string().trim().min(1, "Title is required"),
    description: z.string().trim().optional(),
    content: z.string().trim().optional(),
    url: z.string().trim().optional(),
    language: z.string().trim().optional(),
    tags: z.array(z.string().trim().min(1)),
    fileUrl: z.string().trim().optional(),
    fileName: z.string().trim().optional(),
    fileSize: z.number().int().positive().optional(),
  })
  .refine((data) => data.itemTypeName !== "link" || data.url, {
    message: "URL is required",
    path: ["url"],
  })
  .refine((data) => data.itemTypeName !== "link" || z.string().url().safeParse(data.url).success, {
    message: "Invalid URL",
    path: ["url"],
  })
  .refine((data) => !FILE_ITEM_TYPES.has(data.itemTypeName) || data.fileUrl, {
    message: "File is required",
    path: ["fileUrl"],
  });

export type CreateItemPayload = z.infer<typeof createItemSchema>;

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

export async function createItem(
  data: CreateItemPayload
): Promise<ActionResult<ItemDetail>> {
  const parsed = createItemSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const {
      itemTypeName,
      title,
      description,
      content,
      url,
      language,
      tags,
      fileUrl,
      fileName,
      fileSize,
    } = parsed.data;

    const created = await createItemInDb(session.user.id, {
      itemTypeName,
      title,
      description: description || null,
      content: content || null,
      url: url || null,
      language: language || null,
      tags,
      fileUrl: fileUrl || null,
      fileName: fileName || null,
      fileSize: fileSize ?? null,
    });

    if (!created) {
      return { success: false, error: "Invalid item type" };
    }

    return { success: true, data: created };
  } catch (error) {
    console.error("Failed to create item:", error);
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
