import type { TStarterPlaceholderImage } from '@shinefold/config/constants';
import type { Template_home } from '@shinefold/config/sanity/generated/types';

import type { TStarterDocumentUnion } from './starter-document';
import type { TStarterModuleSlot } from './starter-document-shape';

export type TStarterPlaceholderImageIds = Record<
  TStarterPlaceholderImage,
  string
>;

export type TGrowthHomeSlot = {
  slot: TStarterModuleSlot<Template_home>;
  after: string;
};

export type TGrowthLayer = {
  documents: TStarterDocumentUnion[];
  homeSlots: TGrowthHomeSlot[];
};

export function growthHomeSlots(
  firstAfter: string,
  slots: readonly TStarterModuleSlot<Template_home>[],
): TGrowthHomeSlot[] {
  return slots.map((slot, index) => ({
    slot,
    after: slots[index - 1]?._ref ?? firstAfter,
  }));
}
