import {
  TIMELINE_MARKER_STYLE,
  type TTimelineMarkerStyle,
} from '@blog/config/constants';
import { validateTimelineMarkerRequired } from '@blog/studio/schema-types/validation/validate-timeline-marker-required/validate-timeline-marker-required';
import type { ValidationContext } from 'sanity';

const MARKER_REQUIRED_MESSAGE = 'Add a marker, such as a year.';

const buildContext = (markerStyle?: TTimelineMarkerStyle): ValidationContext =>
  ({ document: { markerStyle } }) as unknown as ValidationContext;

describe(validateTimelineMarkerRequired, () => {
  it.each([
    [
      'a marker is given while Labelled',
      TIMELINE_MARKER_STYLE.LABELLED,
      'Year One',
    ],
    [
      'no marker is given while Numbered',
      TIMELINE_MARKER_STYLE.NUMBERED,
      undefined,
    ],
    ['no markerStyle is set at all', undefined, undefined],
  ])('passes when %s', (_description, markerStyle, marker) => {
    expect(
      validateTimelineMarkerRequired(marker, buildContext(markerStyle)),
    ).toBe(true);
  });

  it('fails with the required-marker message when Labelled has no marker', () => {
    expect(
      validateTimelineMarkerRequired(
        undefined,
        buildContext(TIMELINE_MARKER_STYLE.LABELLED),
      ),
    ).toBe(MARKER_REQUIRED_MESSAGE);
  });
});
