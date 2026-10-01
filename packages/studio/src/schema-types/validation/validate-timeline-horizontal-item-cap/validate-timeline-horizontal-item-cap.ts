import {
  TIMELINE_HORIZONTAL_ITEM_CAP,
  TIMELINE_ORIENTATION,
} from '@blog/config/constants';
import type { TTimelineDocument } from '@blog/studio/schema-types/modules/timeline/timeline-document';
import type { ValidationContext } from 'sanity';

export const validateTimelineHorizontalItemCap = (
  items: unknown[] | undefined,
  context: ValidationContext,
): string | true => {
  const document = context.document as TTimelineDocument | undefined;

  if (document?.orientation !== TIMELINE_ORIENTATION.HORIZONTAL) return true;

  return (items?.length ?? 0) > TIMELINE_HORIZONTAL_ITEM_CAP
    ? 'A horizontal timeline holds at most five items. Switch to Vertical or remove some.'
    : true;
};
