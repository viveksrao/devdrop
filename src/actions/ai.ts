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

const summarizeItemSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  content: z.string().trim().optional(),
  url: z.string().trim().optional(),
});

export type SummarizeItemPayload = z.infer<typeof summarizeItemSchema>;

function parseSummaryFromResponse(raw: string): string {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return "";
  }

  if (typeof parsed === "string") {
    return parsed.trim();
  }

  if (
    parsed &&
    typeof parsed === "object" &&
    typeof (parsed as { summary?: unknown }).summary === "string"
  ) {
    return (parsed as { summary: string }).summary.trim();
  }

  return "";
}

export async function summarizeItem(
  data: SummarizeItemPayload
): Promise<ActionResult<{ summary: string }>> {
  const parsed = summarizeItemSchema.safeParse(data);
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
  const rateLimit = await checkRateLimit("ai-summarize", `${ip}:${session.user.id}`);
  if (!rateLimit.success) {
    return { success: false, error: "Too many AI requests. Please try again shortly." };
  }

  const { title, content, url } = parsed.data;
  const truncatedContent = content?.slice(0, MAX_CONTENT_LENGTH) ?? "";

  try {
    const response = await openai.responses.create({
      model: AI_MODEL,
      instructions:
        "You write concise, 1 to 2 sentence summaries for developer knowledge-base items " +
        "(snippets, prompts, commands, notes, links, files, images). Always respond with json, " +
        `returning the summary as a json object shaped like {"summary": "..."}. The summary ` +
        "should describe what the item is and what it's for, based only on the given title, " +
        "content, and/or URL. If content is empty, base the summary on the title alone.",
      input:
        `Title: ${title}\n\n` +
        (truncatedContent ? `Content:\n${truncatedContent}\n\n` : "") +
        (url ? `URL: ${url}\n\n` : "") +
        "Respond with json only.",
      text: {
        format: { type: "json_object" },
      },
    });

    const summary = parseSummaryFromResponse(response.output_text ?? "");

    return { success: true, data: { summary } };
  } catch (error) {
    console.error("Failed to summarize item:", error);
    if (error instanceof OpenAI.APIError && error.status === 429) {
      return { success: false, error: "AI is busy right now — try again in a moment." };
    }
    return { success: false, error: "AI summary failed. Please try again." };
  }
}

const explainCodeSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  content: z.string().trim().min(1, "Content is required"),
  language: z.string().trim().optional(),
});

export type ExplainCodePayload = z.infer<typeof explainCodeSchema>;

function parseExplanationFromResponse(raw: string): string {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return "";
  }

  if (typeof parsed === "string") {
    return parsed.trim();
  }

  if (
    parsed &&
    typeof parsed === "object" &&
    typeof (parsed as { explanation?: unknown }).explanation === "string"
  ) {
    return (parsed as { explanation: string }).explanation.trim();
  }

  return "";
}

export async function explainCode(
  data: ExplainCodePayload
): Promise<ActionResult<{ explanation: string }>> {
  const parsed = explainCodeSchema.safeParse(data);
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
  const rateLimit = await checkRateLimit("ai-explain", `${ip}:${session.user.id}`);
  if (!rateLimit.success) {
    return { success: false, error: "Too many AI requests. Please try again shortly." };
  }

  const { title, content, language } = parsed.data;
  const truncatedContent = content.slice(0, MAX_CONTENT_LENGTH);

  try {
    const response = await openai.responses.create({
      model: AI_MODEL,
      instructions:
        "You write concise, 200 to 300 word explanations of code snippets and terminal " +
        "commands for developers. Always respond with json, returning the explanation as a " +
        `json object shaped like {"explanation": "..."}. Cover what the code does and any key ` +
        "concepts, patterns, or flags it relies on. Write in markdown (e.g. backticks for " +
        "identifiers, short bullet lists where helpful).",
      input:
        `Title: ${title}\n\n` +
        (language ? `Language: ${language}\n\n` : "") +
        `Code:\n${truncatedContent}\n\n` +
        "Respond with json only.",
      text: {
        format: { type: "json_object" },
      },
    });

    const explanation = parseExplanationFromResponse(response.output_text ?? "");

    return { success: true, data: { explanation } };
  } catch (error) {
    console.error("Failed to explain code:", error);
    if (error instanceof OpenAI.APIError && error.status === 429) {
      return { success: false, error: "AI is busy right now — try again in a moment." };
    }
    return { success: false, error: "AI explanation failed. Please try again." };
  }
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
