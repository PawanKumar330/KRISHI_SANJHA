import { describe, expect, it } from "vitest";
import {
  assertHierarchy,
  LocationHierarchyError,
  normalizeLandArea,
} from "../src/lib/location.js";

// Resolved rows as they come back from the Block->Panchayat->Village join.
const resolved = { village_id: 300, panchayat_id: 20, block_id: 2 };

describe("location hierarchy validation", () => {
  it("accepts a consistent block/panchayat/village triple", () => {
    expect(() =>
      assertHierarchy({ block_id: 2, panchayat_id: 20, village_id: 300 }, resolved),
    ).not.toThrow();
  });

  it("rejects a village that does not exist", () => {
    expect(() =>
      assertHierarchy({ block_id: 2, panchayat_id: 20, village_id: 999 }, null),
    ).toThrow(LocationHierarchyError);
  });

  it("rejects a village that belongs to a different panchayat", () => {
    expect(() =>
      assertHierarchy({ block_id: 2, panchayat_id: 21, village_id: 300 }, resolved),
    ).toThrow(/village does not belong to the selected panchayat/);
  });

  it("rejects a panchayat that belongs to a different block", () => {
    expect(() =>
      assertHierarchy({ block_id: 5, panchayat_id: 20, village_id: 300 }, resolved),
    ).toThrow(/panchayat does not belong to the selected block/);
  });

  it("compares ids numerically so string form data still validates", () => {
    expect(() =>
      assertHierarchy({ block_id: 2, panchayat_id: 20, village_id: 300 }, {
        village_id: 300,
        panchayat_id: "20" as unknown as number,
        block_id: "2" as unknown as number,
      }),
    ).not.toThrow();
  });
});

describe("bigha/katha normalization", () => {
  it("carries 20 katha into a bigha", () => {
    expect(normalizeLandArea(1, 25)).toEqual({ bigha: 2, katha: 5 });
  });
  it("handles katha-only input", () => {
    expect(normalizeLandArea(0, 7)).toEqual({ bigha: 0, katha: 7 });
  });
});
