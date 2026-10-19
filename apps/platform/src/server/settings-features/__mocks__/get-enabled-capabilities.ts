import type { TCapability } from '@blog/config';

export const getEnabledCapabilities = vi.fn<() => Promise<TCapability[]>>(
  async () => [],
);
