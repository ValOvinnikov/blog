import {
  LOCALE_ISO_CODES,
  TIMELINE_MARKER_STYLE,
  type TTimelineMarkerStyle,
} from '@blog/config/constants';
import { validateTimelineMarkerRequired } from '@blog/studio/schema-types/validation/validate-timeline-marker-required/validate-timeline-marker-required';
import type { ValidationContext } from 'sanity';

const { EN, FR } = LOCALE_ISO_CODES;

const MARKER_REQUIRED_MESSAGE = 'Add a marker, such as a year.';

const buildContext = (markerStyle?: TTimelineMarkerStyle): ValidationContext =>
  ({ document: { markerStyle } }) as unknown as ValidationContext;

const markerIn = (language: string, value: string) => [
  { _key: language, language, value },
];

describe(validateTimelineMarkerRequired, () => {
  it.each([
    [
      'a default-language marker is given while Labelled',
      TIMELINE_MARKER_STYLE.LABELLED,
      markerIn(EN, 'Year One'),
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

  it.each([
    ['there is no marker', undefined],
    ['only another language has a marker', markerIn(FR, 'Semaine 1')],
    ['the default-language marker is blank', markerIn(EN, '  ')],
  ])(
    'fails with the required-marker message when Labelled and %s',
    (_description, marker) => {
      expect(
        validateTimelineMarkerRequired(
          marker,
          buildContext(TIMELINE_MARKER_STYLE.LABELLED),
        ),
      ).toBe(MARKER_REQUIRED_MESSAGE);
    },
  );
});
