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
import { SITE_PARTS_ROWS } from '@platform/utils/look-open-rows/look-open-rows';

export type TSitePartsRow = (typeof SITE_PARTS_ROWS)[number];

export type TLookFollowTarget =
  | { kind: typeof LOOK_FOLLOW_TARGET.IDLE }
  | { kind: typeof LOOK_FOLLOW_TARGET.UNEDITED }
  | { kind: typeof LOOK_FOLLOW_TARGET.ALL_OPEN }
  | { kind: typeof LOOK_FOLLOW_TARGET.STYLE; row: TLookRow }
  | { kind: typeof LOOK_FOLLOW_TARGET.PART; row: TSitePartsRow };

export const LOOK_FOLLOW_PART = {
  [LOOK_ROW.HEADER]: SAMPLE_PART.HEADER,
  [LOOK_ROW.FOOTER]: SAMPLE_PART.FOOTER,
  [LOOK_ROW.LANGUAGE_SWITCHER]: SAMPLE_PART.HEADER,
} as const satisfies Record<TSitePartsRow, TSamplePart>;

export const LOOK_FOLLOW_SCROLL = {
  [LOOK_ROW.HEADER]: DEVICE_FRAME_SCROLL_TARGET.TOP,
  [LOOK_ROW.FOOTER]: DEVICE_FRAME_SCROLL_TARGET.END,
  [LOOK_ROW.LANGUAGE_SWITCHER]: DEVICE_FRAME_SCROLL_TARGET.TOP,
} as const satisfies Record<TSitePartsRow, string>;

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
    : { kind: LOOK_FOLLOW_TARGET.STYLE, row };
};

export const toLookFollowKey = (target: TLookFollowTarget) =>
  'row' in target ? `${target.kind}:${target.row}` : target.kind;
