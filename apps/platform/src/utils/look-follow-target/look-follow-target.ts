import type { TMaybeUndefined } from '@blog/config';
import {
  hasArrayGotItems,
  hasArrayGotMultipleItems,
} from '@blog/utils/primitives';
import { DEVICE_FRAME_SCROLL_TARGET } from '@platform/constants/device-frame';
import type { TLookCard } from '@platform/constants/look-card';
import { LOOK_FOLLOW_TARGET } from '@platform/constants/look-follow';
import { LOOK_ROW, type TLookRow } from '@platform/constants/look-row';
import { SAMPLE_PART, type TSamplePart } from '@platform/constants/sample-part';
import {
  SITE_PARTS_ROWS,
  type STYLE_ROWS,
} from '@platform/utils/look-open-rows/look-open-rows';

type TSitePartsRow = (typeof SITE_PARTS_ROWS)[number];
type TStyleRow = (typeof STYLE_ROWS)[number];

export type TLookFollowTarget =
  | { kind: typeof LOOK_FOLLOW_TARGET.IDLE }
  | { kind: typeof LOOK_FOLLOW_TARGET.UNEDITED }
  | { kind: typeof LOOK_FOLLOW_TARGET.ALL_OPEN }
  | {
      kind: typeof LOOK_FOLLOW_TARGET.STYLE;
      row: TStyleRow;
      parts: readonly TSamplePart[];
    }
  | { kind: typeof LOOK_FOLLOW_TARGET.PART; row: TSitePartsRow };

export type TLookFollowOutline = {
  row: TLookRow;
  parts: readonly TSamplePart[];
};

const LOOK_FOLLOW_PART = {
  [LOOK_ROW.HEADER]: SAMPLE_PART.HEADER,
  [LOOK_ROW.FOOTER]: SAMPLE_PART.FOOTER,
  [LOOK_ROW.LANGUAGE_SWITCHER]: SAMPLE_PART.HEADER,
} as const satisfies Record<TSitePartsRow, TSamplePart>;

export const LOOK_FOLLOW_SCROLL = {
  [LOOK_ROW.HEADER]: DEVICE_FRAME_SCROLL_TARGET.TOP,
  [LOOK_ROW.FOOTER]: DEVICE_FRAME_SCROLL_TARGET.END,
  [LOOK_ROW.LANGUAGE_SWITCHER]: DEVICE_FRAME_SCROLL_TARGET.TOP,
} as const satisfies Record<TSitePartsRow, string>;

const CARD_SURFACE_PARTS = [
  SAMPLE_PART.POST_CARD,
  SAMPLE_PART.FAQ_ITEM,
  SAMPLE_PART.QUOTE_CARD,
  SAMPLE_PART.CTA_BOX,
] as const;

const LOOK_STYLE_REACH = {
  [LOOK_ROW.COLOUR]: [],
  [LOOK_ROW.BRAND]: [SAMPLE_PART.BRAND],
  [LOOK_ROW.TYPE]: [],
  [LOOK_ROW.SHAPE]: [...CARD_SURFACE_PARTS, SAMPLE_PART.POST_IMAGE],
  [LOOK_ROW.CARDS]: CARD_SURFACE_PARTS,
  [LOOK_ROW.BUTTONS]: [
    SAMPLE_PART.BUTTON,
    SAMPLE_PART.BUSY_BUTTON,
    SAMPLE_PART.FORM_FIELD,
  ],
} as const satisfies Record<TStyleRow, readonly TSamplePart[]>;

const isSitePartsRow = (row: TLookRow): row is TSitePartsRow =>
  SITE_PARTS_ROWS.some((sitePart) => sitePart === row);

export const toLookFollowTarget = (
  openRows: readonly TLookRow[],
  editedCard: TMaybeUndefined<TLookCard>,
  isAllOpen: boolean,
): TLookFollowTarget => {
  const row =
    openRows.find((openRow) => openRow === editedCard) ??
    (hasArrayGotMultipleItems(openRows) ? undefined : openRows[0]);
  if (isAllOpen && !row) return { kind: LOOK_FOLLOW_TARGET.ALL_OPEN };
  if (!row) {
    return {
      kind: hasArrayGotItems(openRows)
        ? LOOK_FOLLOW_TARGET.UNEDITED
        : LOOK_FOLLOW_TARGET.IDLE,
    };
  }
  return isSitePartsRow(row)
    ? { kind: LOOK_FOLLOW_TARGET.PART, row }
    : { kind: LOOK_FOLLOW_TARGET.STYLE, row, parts: LOOK_STYLE_REACH[row] };
};

export const toLookFollowOutline = (
  target: TLookFollowTarget,
): TMaybeUndefined<TLookFollowOutline> => {
  if (target.kind === LOOK_FOLLOW_TARGET.PART) {
    return { row: target.row, parts: [LOOK_FOLLOW_PART[target.row]] };
  }
  if (target.kind !== LOOK_FOLLOW_TARGET.STYLE) return undefined;
  const { row, parts } = target;
  return hasArrayGotItems(parts) ? { row, parts } : undefined;
};

export const toLookFollowKey = (target: TLookFollowTarget) =>
  'row' in target ? `${target.kind}:${target.row}` : target.kind;
