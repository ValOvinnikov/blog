import {
  TIMELINE_MARKER_STYLE,
  type TTimelineMarkerStyle,
} from '@blog/config/constants';
import type { ValidationContext } from 'sanity';

type TTimelineDocument = { markerStyle?: TTimelineMarkerStyle };

export const validateTimelineMarkerRequired = (
  marker: string | undefined,
  context: ValidationContext,
): string | true => {
  const document = context.document as TTimelineDocument | undefined;

  return document?.markerStyle === TIMELINE_MARKER_STYLE.LABELLED && !marker
    ? 'Add a marker, such as a year.'
    : true;
};
