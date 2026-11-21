import type { TMaybeNull } from '@shinefold/config';
import type { TPaidSubscriberBandCeiling } from '@shinefold/db/constants';

export const getTenantBandAction = vi.fn(
  async (): Promise<TMaybeNull<TPaidSubscriberBandCeiling>> => null,
);
