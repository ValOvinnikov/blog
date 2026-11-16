import type { TCapability } from '@shinefold/config';

export const getEnabledCapabilities = vi.fn<() => Promise<TCapability[]>>(
  async () => [],
);
