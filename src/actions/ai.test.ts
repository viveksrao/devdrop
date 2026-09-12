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

const { generateAutoTags } = await import("./ai");

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
