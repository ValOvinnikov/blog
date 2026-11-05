export const LOOK_LAYOUT_LIMIT = {
  TWO_COLUMN_MIN_WIDTH: 900,
  DOCKED_SAVE_BAR_HEIGHT: 64,
  DOCKED_SAVE_BAR_CLEARANCE: 16,
  // Outlasts the accordion panel's 360ms height transition, so a jump lands where the rows settle.
  ANCHOR_SETTLE_MS: 400,
} as const;
