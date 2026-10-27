import {
  LOCALE_ISO_CODES,
  TIMELINE_MARKER_STYLE,
  type TTimelineMarkerStyle,
} from '@blog/config/constants';
import { validateTimelineMarkerRequired } from '@blog/studio/schema-types/validation/validate-timeline-marker-required/validate-timeline-marker-required';
import { mockLocalizedValue } from '@blog/studio/testing/mock-documents';
import { faker } from '@faker-js/faker';
import type { ValidationContext } from 'sanity';

faker.seed(6025);

const { EN, FR } = LOCALE_ISO_CODES;

const MARKER_REQUIRED_MESSAGE = 'Add a marker, such as a year.';

const MOCK_ENGLISH_MARKER = [mockLocalizedValue(EN, faker.lorem.words())];
const MOCK_FRENCH_MARKER = [mockLocalizedValue(FR, faker.lorem.words())];

const contextWithMarkerStyle = (
  markerStyle?: TTimelineMarkerStyle,
): ValidationContext =>
  ({ document: { markerStyle } }) as unknown as ValidationContext;

describe(validateTimelineMarkerRequired, () => {
  it.each([
    [
      'a default-language marker is given while Labelled',
      TIMELINE_MARKER_STYLE.LABELLED,
      MOCK_ENGLISH_MARKER,
    ],
    [
      'no marker is given while Numbered',
      TIMELINE_MARKER_STYLE.NUMBERED,
      undefined,
    ],
    ['no marker style is set at all', undefined, undefined],
  ])('passes when %s', (_description, markerStyle, marker) => {
    expect(
      validateTimelineMarkerRequired(
        marker,
        contextWithMarkerStyle(markerStyle),
      ),
    ).toBe(true);
  });

  it.each([
    ['there is no marker', undefined],
    ['only another language has a marker', MOCK_FRENCH_MARKER],
    ['the default-language marker is blank', [mockLocalizedValue(EN, '  ')]],
  ])('fails when Labelled and %s', (_description, marker) => {
    expect(
      validateTimelineMarkerRequired(
        marker,
        contextWithMarkerStyle(TIMELINE_MARKER_STYLE.LABELLED),
      ),
    ).toBe(MARKER_REQUIRED_MESSAGE);
  });
});
