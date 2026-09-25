import { TIMELINE_MARKER_STYLE } from '@blog/config/constants';
import type { TTimelineDocument } from '@blog/studio/schema-types/modules/timeline/timeline-document';
import type { ValidationContext } from 'sanity';

export const validateTimelineMarkerRequired = (
  marker: string | undefined,
  context: ValidationContext,
): string | true => {
  const document = context.document as TTimelineDocument | undefined;

  return document?.markerStyle === TIMELINE_MARKER_STYLE.LABELLED && !marker
    ? 'Add a marker, such as a year.'
    : true;
};
