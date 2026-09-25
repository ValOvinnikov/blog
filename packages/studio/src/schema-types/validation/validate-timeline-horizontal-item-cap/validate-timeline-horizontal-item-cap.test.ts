import {
  TIMELINE_ORIENTATION,
  type TTimelineOrientation,
} from '@blog/config/constants';
import { validateTimelineHorizontalItemCap } from '@blog/studio/schema-types/validation/validate-timeline-horizontal-item-cap/validate-timeline-horizontal-item-cap';
import type { ValidationContext } from 'sanity';

const CAP_MESSAGE =
  'A horizontal timeline holds at most five items. Switch to Vertical or remove some.';

const buildContext = (orientation?: TTimelineOrientation): ValidationContext =>
  ({ document: { orientation } }) as unknown as ValidationContext;

describe(validateTimelineHorizontalItemCap, () => {
  it.each([
    ['exactly five items horizontally', 5, TIMELINE_ORIENTATION.HORIZONTAL],
    ['six items when vertical', 6, TIMELINE_ORIENTATION.VERTICAL],
    ['no items horizontally', undefined, TIMELINE_ORIENTATION.HORIZONTAL],
    ['six items with no orientation set', 6, undefined],
  ])('passes with %s', (_description, itemCount, orientation) => {
    const items = itemCount === undefined ? undefined : Array(itemCount);

    expect(
      validateTimelineHorizontalItemCap(items, buildContext(orientation)),
    ).toBe(true);
  });

  it('fails with the cap message when a horizontal document has six items', () => {
    const items = Array(6);

    expect(
      validateTimelineHorizontalItemCap(
        items,
        buildContext(TIMELINE_ORIENTATION.HORIZONTAL),
      ),
    ).toBe(CAP_MESSAGE);
  });
});
