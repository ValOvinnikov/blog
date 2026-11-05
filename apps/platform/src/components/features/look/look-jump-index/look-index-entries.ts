import { LOOK_CARD, type TLookCard } from '@platform/constants/look-card';
import { LOOK_GROUP, type TLookGroup } from '@platform/constants/look-group';
import {
  SITE_PARTS_ROWS,
  STYLE_ROWS,
} from '@platform/utils/look-open-rows/look-open-rows';

type TLookIndexEntry =
  | { card: TLookCard }
  | {
      group: TLookGroup;
      titleKey: 'styleGroupHeading' | 'sitePartsGroupHeading';
    };

export const LOOK_INDEX_ENTRIES: readonly TLookIndexEntry[] = [
  { card: LOOK_CARD.PRESET },
  { group: LOOK_GROUP.STYLE, titleKey: 'styleGroupHeading' },
  ...STYLE_ROWS.map((card) => ({ card })),
  { group: LOOK_GROUP.SITE_PARTS, titleKey: 'sitePartsGroupHeading' },
  ...SITE_PARTS_ROWS.map((card) => ({ card })),
];
