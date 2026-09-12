"use server";

import { z } from "zod";
import { headers } from "next/headers";
import OpenAI from "openai";
import { auth } from "@/auth";
import { openai, AI_MODEL } from "@/lib/openai";
import { checkRateLimit } from "@/lib/rate-limit";

interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const MAX_CONTENT_LENGTH = 2000;
const MAX_SUGGESTED_TAGS = 5;

function getClientIpFromHeaders(headerList: Awaited<ReturnType<typeof headers>>): string {
  const forwardedFor = headerList.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  return headerList.get("x-real-ip") ?? "unknown";
}

const generateAutoTagsSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  content: z.string().trim().optional(),
});

export type GenerateAutoTagsPayload = z.infer<typeof generateAutoTagsSchema>;

function parseTagsFromResponse(raw: string): string[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }

  const list = Array.isArray(parsed)
    ? parsed
    : parsed && typeof parsed === "object" && Array.isArray((parsed as { tags?: unknown }).tags)
      ? (parsed as { tags: unknown[] }).tags
      : [];

  return list
    .filter((tag): tag is string => typeof tag === "string")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, MAX_SUGGESTED_TAGS);
}

export async function generateAutoTags(
  data: GenerateAutoTagsPayload
): Promise<ActionResult<{ tags: string[] }>> {
  const parsed = generateAutoTagsSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  if (!session.user.isPro) {
    return { success: false, error: "AI features require DevDrop Pro" };
  }

  const ip = getClientIpFromHeaders(await headers());
  const rateLimit = await checkRateLimit("ai-suggest-tags", `${ip}:${session.user.id}`);
  if (!rateLimit.success) {
    return { success: false, error: "Too many AI requests. Please try again shortly." };
  }

  const { title, content } = parsed.data;
  const truncatedContent = content?.slice(0, MAX_CONTENT_LENGTH) ?? "";

  try {
    const response = await openai.responses.create({
      model: AI_MODEL,
      instructions:
        "You suggest concise, lowercase, freeform tags for developer knowledge-base items " +
        "(snippets, prompts, commands, notes, links). Always respond with json, returning 3 " +
        `to 5 tags as a json object shaped like {"tags": ["tag1", "tag2"]}. Tags should be ` +
        "short (1-3 words), relevant to the technology/topic/purpose of the content, and lowercase.",
      input:
        `Title: ${title}\n\nContent:\n${truncatedContent}\n\n` +
        "Respond with json only.",
      text: {
        format: { type: "json_object" },
      },
    });

    const tags = parseTagsFromResponse(response.output_text ?? "");

    return { success: true, data: { tags } };
  } catch (error) {
    console.error("Failed to generate auto tags:", error);
    if (error instanceof OpenAI.APIError && error.status === 429) {
      return { success: false, error: "AI is busy right now — try again in a moment." };
    }
    return { success: false, error: "AI suggestion failed. Please try again." };
  }
}
