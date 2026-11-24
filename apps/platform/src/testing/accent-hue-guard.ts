import type * as ShinefoldConfig from '@shinefold/config';

export const mockAccentHueGuard = async () => ({
  ...(await vi.importActual<typeof ShinefoldConfig>('@shinefold/config')),
  isAccentHueAccessible: vi.fn(() => true),
});
