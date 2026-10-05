import { TIMELINE_MARKER_STYLE } from '@blog/config/constants';
import type { TTimelineDocument } from '@blog/studio/schema-types/modules/timeline/timeline-document';
import { defaultLanguageValue } from '@blog/studio/schema-types/validation/default-language-value/default-language-value';
import type { ValidationContext } from 'sanity';

export const validateTimelineMarkerRequired = (
  marker: unknown,
  context: ValidationContext,
): string | true => {
  const document = context.document as TTimelineDocument | undefined;

  return document?.markerStyle === TIMELINE_MARKER_STYLE.LABELLED &&
    defaultLanguageValue(marker) === undefined
    ? 'Add a marker, such as a year.'
    : true;
};
