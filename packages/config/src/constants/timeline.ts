import type { TValueOf } from '@blog/config/utils';

export const TIMELINE_MARKER_STYLE = {
  NUMBERED: 'NUMBERED',
  LABELLED: 'LABELLED',
} as const;

export type TTimelineMarkerStyle = TValueOf<typeof TIMELINE_MARKER_STYLE>;

export const TIMELINE_ORIENTATION = {
  VERTICAL: 'VERTICAL',
  HORIZONTAL: 'HORIZONTAL',
} as const;

export type TTimelineOrientation = TValueOf<typeof TIMELINE_ORIENTATION>;
