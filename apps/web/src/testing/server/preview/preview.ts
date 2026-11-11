export const MOCK_PREVIEW_LINK_TTL_MS = 10 * 60_000;

export const mockDraftMode = (isEnabled = false) => ({
  isEnabled,
  enable: vi.fn(),
  disable: vi.fn(),
});
