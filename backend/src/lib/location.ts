/**
 * Location hierarchy validation (Block -> Panchayat -> Village).
 * Pure logic is kept separate from DB access so it is unit-testable.
 */

export type HierarchyRow = {
  village_id: number;
  panchayat_id: number;
  block_id: number;
};

export type HierarchySelection = {
  block_id: number;
  panchayat_id: number;
  village_id: number;
};

export class LocationHierarchyError extends Error {
  status = 400;
  constructor(message: string) {
    super(message);
    this.name = "LocationHierarchyError";
  }
}

/**
 * Validates a user-submitted Block/Panchayat/Village triple against the row
 * resolved from the database for `village_id`.
 * Throws when the village does not exist, or does not belong to the selected
 * panchayat, or the panchayat does not belong to the selected block.
 */
export function assertHierarchy(
  selection: HierarchySelection,
  resolved: HierarchyRow | null | undefined,
): void {
  if (!resolved) {
    throw new LocationHierarchyError("Selected village does not exist in Jamui district");
  }
  if (Number(resolved.panchayat_id) !== Number(selection.panchayat_id)) {
    throw new LocationHierarchyError("Selected village does not belong to the selected panchayat");
  }
  if (Number(resolved.block_id) !== Number(selection.block_id)) {
    throw new LocationHierarchyError("Selected panchayat does not belong to the selected block");
  }
}

/** Bigha/Katha conversion used across Bihar: 1 bigha = 20 katha. */
export const KATHA_PER_BIGHA = 20;

export function normalizeLandArea(bigha = 0, katha = 0): { bigha: number; katha: number } {
  const totalKatha = bigha * KATHA_PER_BIGHA + katha;
  return {
    bigha: Math.floor(totalKatha / KATHA_PER_BIGHA),
    katha: Number((totalKatha % KATHA_PER_BIGHA).toFixed(3)),
  };
}
