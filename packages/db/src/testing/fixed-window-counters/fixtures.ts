export const MOCK_WINDOW_OPENED_AT = new Date('2026-06-15T12:00:00.000Z');
export const MOCK_WINDOW_MS = 60 * 60_000;

export const MOCK_AFTER_WINDOW = new Date(
  MOCK_WINDOW_OPENED_AT.getTime() + MOCK_WINDOW_MS + 1_000,
);
export const MOCK_INSIDE_RESTARTED_WINDOW = new Date(
  MOCK_AFTER_WINDOW.getTime() + MOCK_WINDOW_MS / 2,
);
