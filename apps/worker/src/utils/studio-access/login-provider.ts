import {
  SANITY_LOGIN_PROVIDER,
  type TSanityLoginProvider,
} from '@shinefold/config/constants';
import type { TMaybeNull, TMaybeUndefined } from '@shinefold/config/types';

export function toLoginProvider(
  provider: TMaybeUndefined<string>,
): TMaybeNull<TSanityLoginProvider> {
  const normalized = provider?.toUpperCase();
  return (
    Object.values(SANITY_LOGIN_PROVIDER).find(
      (value) => value === normalized,
    ) ?? null
  );
}
