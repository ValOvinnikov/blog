import {
  TIMELINE_HORIZONTAL_ITEM_CAP,
  TIMELINE_ORIENTATION,
  type TTimelineOrientation,
} from '@blog/config/constants';
import { validateTimelineHorizontalItemCap } from '@blog/studio/schema-types/validation/validate-timeline-horizontal-item-cap/validate-timeline-horizontal-item-cap';
import type { ValidationContext } from 'sanity';

const CAP_MESSAGE =
  'A horizontal timeline holds at most five items. Switch to Vertical or remove some.';

const OVER_CAP = TIMELINE_HORIZONTAL_ITEM_CAP + 1;

const contextWithOrientation = (
  orientation?: TTimelineOrientation,
): ValidationContext =>
  ({ document: { orientation } }) as unknown as ValidationContext;

describe(validateTimelineHorizontalItemCap, () => {
  it.each([
    [
      'passes with a full horizontal timeline',
      TIMELINE_HORIZONTAL_ITEM_CAP,
      TIMELINE_ORIENTATION.HORIZONTAL,
      true,
    ],
    [
      'passes with more items than the cap when vertical',
      OVER_CAP,
      TIMELINE_ORIENTATION.VERTICAL,
      true,
    ],
    [
      'passes with no items horizontally',
      undefined,
      TIMELINE_ORIENTATION.HORIZONTAL,
      true,
    ],
    [
      'passes with more items than the cap and no orientation set',
      OVER_CAP,
      undefined,
      true,
    ],
    [
      'fails with more items than the cap when horizontal',
      OVER_CAP,
      TIMELINE_ORIENTATION.HORIZONTAL,
      CAP_MESSAGE,
    ],
  ])('%s', (_description, itemCount, orientation, expected) => {
    const items = itemCount === undefined ? undefined : Array(itemCount);

    expect(
      validateTimelineHorizontalItemCap(
        items,
        contextWithOrientation(orientation),
      ),
    ).toBe(expected);
  });
});
