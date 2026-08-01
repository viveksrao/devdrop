import { describe, expect, it } from "vitest";
import { getItemTypeNameFromSlug } from "./item-types";

describe("getItemTypeNameFromSlug", () => {
  it("resolves a known plural slug to its type name", () => {
    expect(getItemTypeNameFromSlug("snippets")).toBe("snippet");
    expect(getItemTypeNameFromSlug("images")).toBe("image");
  });

  it("returns undefined for an unrecognized slug", () => {
    expect(getItemTypeNameFromSlug("bogus")).toBeUndefined();
  });

  it("does not match a singular (non-pluralized) name", () => {
    expect(getItemTypeNameFromSlug("snippet")).toBeUndefined();
  });
});
