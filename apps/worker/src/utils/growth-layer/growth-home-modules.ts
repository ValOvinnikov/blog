import type { TGrowthHomeSlot } from '@shinefold/config';
import type { TMaybeNull } from '@shinefold/config/types';

export type THomeModuleSlot = { _key: string; _ref?: string };

// A slot whose anchor the owner removed goes last rather than being dropped.
export function withGrowthHomeSlots(
  modules: readonly THomeModuleSlot[],
  homeSlots: readonly TGrowthHomeSlot[],
): TMaybeNull<THomeModuleSlot[]> {
  const next = [...modules];
  let added = 0;

  for (const { slot, after } of homeSlots) {
    const isPresent = next.some(
      ({ _key, _ref }) => _key === slot._key || _ref === slot._ref,
    );
    if (isPresent) continue;

    const anchor = next.findIndex(({ _ref }) => _ref === after);
    next.splice(anchor === -1 ? next.length : anchor + 1, 0, slot);
    added += 1;
  }

  return added === 0 ? null : next;
}
