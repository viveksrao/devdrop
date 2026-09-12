import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
  maxRetries: 3,
});

export const AI_MODEL = "gpt-5-nano";
