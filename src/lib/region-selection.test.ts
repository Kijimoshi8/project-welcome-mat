import { describe, expect, it } from "vitest";
import { selectedRegions, toggleRegion } from "./region-selection";

describe("Explorer region selection", () => {
  it("keeps every region deselected after removing the last region", () => {
    expect(selectedRegions(toggleRegion(["plock"], "plock"))).toEqual([]);
  });

  it("allows choosing a region again from the empty selection", () => {
    expect(selectedRegions(toggleRegion([], "sierpc"))).toEqual(["sierpc"]);
  });

  it("uses defaults only when no selection has been supplied", () => {
    expect(selectedRegions(undefined)).toEqual(["plock", "gostynin", "sierpc"]);
    expect(selectedRegions("")).toEqual([]);
  });
});