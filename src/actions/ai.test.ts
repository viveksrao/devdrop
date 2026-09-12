import { describe, expect, it, vi, beforeEach } from "vitest";

const mockAuth = vi.fn();
const mockCheckRateLimit = vi.fn();
const mockResponsesCreate = vi.fn();
const mockHeadersGet = vi.fn();

vi.mock("@/auth", () => ({ auth: mockAuth }));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: mockCheckRateLimit,
}));

vi.mock("@/lib/openai", () => ({
  openai: {
    responses: { create: mockResponsesCreate },
  },
  AI_MODEL: "gpt-5-nano",
}));

vi.mock("next/headers", () => ({
  headers: async () => ({ get: mockHeadersGet }),
}));

const { generateAutoTags, summarizeItem, explainCode, optimizePrompt } = await import("./ai");

beforeEach(() => {
  mockAuth.mockReset();
  mockCheckRateLimit.mockReset().mockResolvedValue({ success: true, remaining: 19, reset: 0 });
  mockResponsesCreate.mockReset();
  mockHeadersGet.mockReset().mockReturnValue(null);
});

describe("generateAutoTags", () => {
  it("rejects a missing title", async () => {
    const result = await generateAutoTags({ title: "  ", content: "some content" });

    expect(result).toEqual({ success: false, error: "Title is required" });
    expect(mockAuth).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated requests", async () => {
    mockAuth.mockResolvedValueOnce(null);

    const result = await generateAutoTags({ title: "My snippet" });

    expect(result).toEqual({ success: false, error: "Unauthorized" });
    expect(mockResponsesCreate).not.toHaveBeenCalled();
  });

  it("rejects free (non-Pro) users", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1", isPro: false } });

    const result = await generateAutoTags({ title: "My snippet" });

    expect(result).toEqual({ success: false, error: "AI features require DevDrop Pro" });
    expect(mockResponsesCreate).not.toHaveBeenCalled();
  });

  it("returns a rate-limit error when the limit is exceeded", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1", isPro: true } });
    mockCheckRateLimit.mockResolvedValueOnce({ success: false, remaining: 0, reset: 0 });

    const result = await generateAutoTags({ title: "My snippet" });

    expect(result).toEqual({
      success: false,
      error: "Too many AI requests. Please try again shortly.",
    });
    expect(mockResponsesCreate).not.toHaveBeenCalled();
  });

  it("parses tags from a {tags: [...]} JSON response and lowercases them", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1", isPro: true } });
    mockResponsesCreate.mockResolvedValueOnce({
      output_text: JSON.stringify({ tags: ["React", "TypeScript", "Hooks"] }),
    });

    const result = await generateAutoTags({ title: "useAuth hook", content: "some code" });

    expect(result).toEqual({
      success: true,
      data: { tags: ["react", "typescript", "hooks"] },
    });
  });

  it("parses tags from a bare JSON array response", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1", isPro: true } });
    mockResponsesCreate.mockResolvedValueOnce({
      output_text: JSON.stringify(["python", "cli"]),
    });

    const result = await generateAutoTags({ title: "A script" });

    expect(result).toEqual({ success: true, data: { tags: ["python", "cli"] } });
  });

  it("caps suggestions at 5 tags", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1", isPro: true } });
    mockResponsesCreate.mockResolvedValueOnce({
      output_text: JSON.stringify({ tags: ["a", "b", "c", "d", "e", "f", "g"] }),
    });

    const result = await generateAutoTags({ title: "Something" });

    expect(result.data?.tags).toEqual(["a", "b", "c", "d", "e"]);
  });

  it("returns an empty tag list when the response is unparseable", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1", isPro: true } });
    mockResponsesCreate.mockResolvedValueOnce({ output_text: "not json" });

    const result = await generateAutoTags({ title: "Something" });

    expect(result).toEqual({ success: true, data: { tags: [] } });
  });

  it("truncates content to 2000 chars before calling the model", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1", isPro: true } });
    mockResponsesCreate.mockResolvedValueOnce({ output_text: JSON.stringify({ tags: [] }) });

    const longContent = "x".repeat(5000);
    await generateAutoTags({ title: "Something", content: longContent });

    const call = mockResponsesCreate.mock.calls[0][0];
    expect(call.input).toContain("x".repeat(2000));
    expect(call.input).not.toContain("x".repeat(2001));
  });

  it("catches unexpected errors and returns a generic message", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1", isPro: true } });
    mockResponsesCreate.mockRejectedValueOnce(new Error("network down"));

    const result = await generateAutoTags({ title: "Something" });

    expect(result).toEqual({
      success: false,
      error: "AI suggestion failed. Please try again.",
    });
  });
});

describe("summarizeItem", () => {
  it("rejects a missing title", async () => {
    const result = await summarizeItem({ title: "  ", content: "some content" });

    expect(result).toEqual({ success: false, error: "Title is required" });
    expect(mockAuth).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated requests", async () => {
    mockAuth.mockResolvedValueOnce(null);

    const result = await summarizeItem({ title: "My snippet" });

    expect(result).toEqual({ success: false, error: "Unauthorized" });
    expect(mockResponsesCreate).not.toHaveBeenCalled();
  });

  it("rejects free (non-Pro) users", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1", isPro: false } });

    const result = await summarizeItem({ title: "My snippet" });

    expect(result).toEqual({ success: false, error: "AI features require DevDrop Pro" });
    expect(mockResponsesCreate).not.toHaveBeenCalled();
  });

  it("returns a rate-limit error when the limit is exceeded", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1", isPro: true } });
    mockCheckRateLimit.mockResolvedValueOnce({ success: false, remaining: 0, reset: 0 });

    const result = await summarizeItem({ title: "My snippet" });

    expect(result).toEqual({
      success: false,
      error: "Too many AI requests. Please try again shortly.",
    });
    expect(mockResponsesCreate).not.toHaveBeenCalled();
  });

  it("parses a summary from a {summary: ...} JSON response", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1", isPro: true } });
    mockResponsesCreate.mockResolvedValueOnce({
      output_text: JSON.stringify({ summary: "A hook for fetching data with cleanup." }),
    });

    const result = await summarizeItem({ title: "useFetch hook", content: "some code" });

    expect(result).toEqual({
      success: true,
      data: { summary: "A hook for fetching data with cleanup." },
    });
  });

  it("parses a summary from a bare JSON string response", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1", isPro: true } });
    mockResponsesCreate.mockResolvedValueOnce({
      output_text: JSON.stringify("A short summary."),
    });

    const result = await summarizeItem({ title: "A script" });

    expect(result).toEqual({ success: true, data: { summary: "A short summary." } });
  });

  it("returns an empty summary when the response is unparseable", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1", isPro: true } });
    mockResponsesCreate.mockResolvedValueOnce({ output_text: "not json" });

    const result = await summarizeItem({ title: "Something" });

    expect(result).toEqual({ success: true, data: { summary: "" } });
  });

  it("truncates content to 2000 chars before calling the model", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1", isPro: true } });
    mockResponsesCreate.mockResolvedValueOnce({
      output_text: JSON.stringify({ summary: "" }),
    });

    const longContent = "x".repeat(5000);
    await summarizeItem({ title: "Something", content: longContent });

    const call = mockResponsesCreate.mock.calls[0][0];
    expect(call.input).toContain("x".repeat(2000));
    expect(call.input).not.toContain("x".repeat(2001));
  });

  it("includes the URL in the prompt when provided", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1", isPro: true } });
    mockResponsesCreate.mockResolvedValueOnce({
      output_text: JSON.stringify({ summary: "" }),
    });

    await summarizeItem({ title: "A link", url: "https://example.com" });

    const call = mockResponsesCreate.mock.calls[0][0];
    expect(call.input).toContain("https://example.com");
  });

  it("summarizes from title alone when content is absent", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1", isPro: true } });
    mockResponsesCreate.mockResolvedValueOnce({
      output_text: JSON.stringify({ summary: "" }),
    });

    await summarizeItem({ title: "Just a title" });

    const call = mockResponsesCreate.mock.calls[0][0];
    expect(call.input).toContain("Just a title");
    expect(call.input).not.toContain("Content:");
  });

  it("catches unexpected errors and returns a generic message", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1", isPro: true } });
    mockResponsesCreate.mockRejectedValueOnce(new Error("network down"));

    const result = await summarizeItem({ title: "Something" });

    expect(result).toEqual({
      success: false,
      error: "AI summary failed. Please try again.",
    });
  });
});

describe("explainCode", () => {
  it("rejects a missing title", async () => {
    const result = await explainCode({ title: "  ", content: "console.log(1)" });

    expect(result).toEqual({ success: false, error: "Title is required" });
    expect(mockAuth).not.toHaveBeenCalled();
  });

  it("rejects missing content", async () => {
    const result = await explainCode({ title: "My snippet", content: "  " });

    expect(result).toEqual({ success: false, error: "Content is required" });
    expect(mockAuth).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated requests", async () => {
    mockAuth.mockResolvedValueOnce(null);

    const result = await explainCode({ title: "My snippet", content: "console.log(1)" });

    expect(result).toEqual({ success: false, error: "Unauthorized" });
    expect(mockResponsesCreate).not.toHaveBeenCalled();
  });

  it("rejects free (non-Pro) users", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1", isPro: false } });

    const result = await explainCode({ title: "My snippet", content: "console.log(1)" });

    expect(result).toEqual({ success: false, error: "AI features require DevDrop Pro" });
    expect(mockResponsesCreate).not.toHaveBeenCalled();
  });

  it("returns a rate-limit error when the limit is exceeded", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1", isPro: true } });
    mockCheckRateLimit.mockResolvedValueOnce({ success: false, remaining: 0, reset: 0 });

    const result = await explainCode({ title: "My snippet", content: "console.log(1)" });

    expect(result).toEqual({
      success: false,
      error: "Too many AI requests. Please try again shortly.",
    });
    expect(mockResponsesCreate).not.toHaveBeenCalled();
  });

  it("parses an explanation from a {explanation: ...} JSON response", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1", isPro: true } });
    mockResponsesCreate.mockResolvedValueOnce({
      output_text: JSON.stringify({ explanation: "This logs 1 to the console." }),
    });

    const result = await explainCode({ title: "A snippet", content: "console.log(1)" });

    expect(result).toEqual({
      success: true,
      data: { explanation: "This logs 1 to the console." },
    });
  });

  it("parses an explanation from a bare JSON string response", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1", isPro: true } });
    mockResponsesCreate.mockResolvedValueOnce({
      output_text: JSON.stringify("A short explanation."),
    });

    const result = await explainCode({ title: "A snippet", content: "console.log(1)" });

    expect(result).toEqual({ success: true, data: { explanation: "A short explanation." } });
  });

  it("returns an empty explanation when the response is unparseable", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1", isPro: true } });
    mockResponsesCreate.mockResolvedValueOnce({ output_text: "not json" });

    const result = await explainCode({ title: "A snippet", content: "console.log(1)" });

    expect(result).toEqual({ success: true, data: { explanation: "" } });
  });

  it("truncates content to 2000 chars before calling the model", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1", isPro: true } });
    mockResponsesCreate.mockResolvedValueOnce({
      output_text: JSON.stringify({ explanation: "" }),
    });

    const longContent = "x".repeat(5000);
    await explainCode({ title: "A snippet", content: longContent });

    const call = mockResponsesCreate.mock.calls[0][0];
    expect(call.input).toContain("x".repeat(2000));
    expect(call.input).not.toContain("x".repeat(2001));
  });

  it("includes the language in the prompt when provided", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1", isPro: true } });
    mockResponsesCreate.mockResolvedValueOnce({
      output_text: JSON.stringify({ explanation: "" }),
    });

    await explainCode({ title: "A snippet", content: "console.log(1)", language: "javascript" });

    const call = mockResponsesCreate.mock.calls[0][0];
    expect(call.input).toContain("Language: javascript");
  });

  it("omits the language line when not provided", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1", isPro: true } });
    mockResponsesCreate.mockResolvedValueOnce({
      output_text: JSON.stringify({ explanation: "" }),
    });

    await explainCode({ title: "A snippet", content: "console.log(1)" });

    const call = mockResponsesCreate.mock.calls[0][0];
    expect(call.input).not.toContain("Language:");
  });

  it("catches unexpected errors and returns a generic message", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1", isPro: true } });
    mockResponsesCreate.mockRejectedValueOnce(new Error("network down"));

    const result = await explainCode({ title: "A snippet", content: "console.log(1)" });

    expect(result).toEqual({
      success: false,
      error: "AI explanation failed. Please try again.",
    });
  });

  it("returns a friendlier message on a 429 from OpenAI", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1", isPro: true } });
    const OpenAI = (await import("openai")).default;
    mockResponsesCreate.mockRejectedValueOnce(
      new OpenAI.APIError(429, { message: "rate limited" }, "rate limited", new Headers())
    );

    const result = await explainCode({ title: "A snippet", content: "console.log(1)" });

    expect(result).toEqual({
      success: false,
      error: "AI is busy right now — try again in a moment.",
    });
  });
});

describe("optimizePrompt", () => {
  it("rejects a missing title", async () => {
    const result = await optimizePrompt({ title: "  ", content: "Write a poem" });

    expect(result).toEqual({ success: false, error: "Title is required" });
    expect(mockAuth).not.toHaveBeenCalled();
  });

  it("rejects missing content", async () => {
    const result = await optimizePrompt({ title: "My prompt", content: "  " });

    expect(result).toEqual({ success: false, error: "Content is required" });
    expect(mockAuth).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated requests", async () => {
    mockAuth.mockResolvedValueOnce(null);

    const result = await optimizePrompt({ title: "My prompt", content: "Write a poem" });

    expect(result).toEqual({ success: false, error: "Unauthorized" });
    expect(mockResponsesCreate).not.toHaveBeenCalled();
  });

  it("rejects free (non-Pro) users", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1", isPro: false } });

    const result = await optimizePrompt({ title: "My prompt", content: "Write a poem" });

    expect(result).toEqual({ success: false, error: "AI features require DevDrop Pro" });
    expect(mockResponsesCreate).not.toHaveBeenCalled();
  });

  it("returns a rate-limit error when the limit is exceeded", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1", isPro: true } });
    mockCheckRateLimit.mockResolvedValueOnce({ success: false, remaining: 0, reset: 0 });

    const result = await optimizePrompt({ title: "My prompt", content: "Write a poem" });

    expect(result).toEqual({
      success: false,
      error: "Too many AI requests. Please try again shortly.",
    });
    expect(mockResponsesCreate).not.toHaveBeenCalled();
  });

  it("parses an optimized prompt from a {optimizedPrompt: ...} JSON response", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1", isPro: true } });
    mockResponsesCreate.mockResolvedValueOnce({
      output_text: JSON.stringify({ optimizedPrompt: "Write a haiku about autumn leaves." }),
    });

    const result = await optimizePrompt({ title: "A prompt", content: "write a poem" });

    expect(result).toEqual({
      success: true,
      data: { optimizedPrompt: "Write a haiku about autumn leaves." },
    });
  });

  it("parses an optimized prompt from a bare JSON string response", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1", isPro: true } });
    mockResponsesCreate.mockResolvedValueOnce({
      output_text: JSON.stringify("A refined prompt."),
    });

    const result = await optimizePrompt({ title: "A prompt", content: "write a poem" });

    expect(result).toEqual({ success: true, data: { optimizedPrompt: "A refined prompt." } });
  });

  it("returns an empty optimized prompt when the response is unparseable", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1", isPro: true } });
    mockResponsesCreate.mockResolvedValueOnce({ output_text: "not json" });

    const result = await optimizePrompt({ title: "A prompt", content: "write a poem" });

    expect(result).toEqual({ success: true, data: { optimizedPrompt: "" } });
  });

  it("truncates content to 2000 chars before calling the model", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1", isPro: true } });
    mockResponsesCreate.mockResolvedValueOnce({
      output_text: JSON.stringify({ optimizedPrompt: "" }),
    });

    const longContent = "x".repeat(5000);
    await optimizePrompt({ title: "A prompt", content: longContent });

    const call = mockResponsesCreate.mock.calls[0][0];
    expect(call.input).toContain("x".repeat(2000));
    expect(call.input).not.toContain("x".repeat(2001));
  });

  it("catches unexpected errors and returns a generic message", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1", isPro: true } });
    mockResponsesCreate.mockRejectedValueOnce(new Error("network down"));

    const result = await optimizePrompt({ title: "A prompt", content: "write a poem" });

    expect(result).toEqual({
      success: false,
      error: "AI prompt optimization failed. Please try again.",
    });
  });

  it("returns a friendlier message on a 429 from OpenAI", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1", isPro: true } });
    const OpenAI = (await import("openai")).default;
    mockResponsesCreate.mockRejectedValueOnce(
      new OpenAI.APIError(429, { message: "rate limited" }, "rate limited", new Headers())
    );

    const result = await optimizePrompt({ title: "A prompt", content: "write a poem" });

    expect(result).toEqual({
      success: false,
      error: "AI is busy right now — try again in a moment.",
    });
  });
});
