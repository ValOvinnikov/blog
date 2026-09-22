import { DISPLAY_MODE } from '@blog/config/constants';
import { logoWallSchema } from '@blog/studio/schema-types/modules/logo-wall/logo-wall';
import {
  getRecordedBounds,
  getCustomValidatorWithLevel,
} from '@blog/studio/testing/create-mock-validation-rule';
import { getField } from '@blog/studio/testing/get-field';
import type { SanityDocument } from 'sanity';

type TDocFn = (document: SanityDocument | undefined) => string | true;

describe('logoWallSchema logos field validation', () => {
  it('is unique and bounded to three through twelve references', () => {
    const logosField = getField(logoWallSchema, 'logos');

    expect(getRecordedBounds(logosField)).toEqual({
      unique: true,
      min: 3,
      max: 12,
    });
  });
});

describe('logoWallSchema document validation', () => {
  const getValidator = () =>
    getCustomValidatorWithLevel<TDocFn>(logoWallSchema);

  it.each([
    [
      DISPLAY_MODE.CAROUSEL,
      6,
      'Six or fewer logos fit in one row — Grid shows them all without scrolling.',
    ],
    [DISPLAY_MODE.CAROUSEL, 7, true],
    [DISPLAY_MODE.GRID, 3, true],
  ])('displayMode %s, %s logos → %j', (displayMode, count, expected) => {
    const { fn: validate, isWarning } = getValidator();

    expect(
      validate({
        displayMode,
        logos: Array.from({ length: count }, (_, index) => ({
          _ref: `logo-${String(index)}`,
        })),
      } as unknown as SanityDocument),
    ).toBe(expected);
    expect(isWarning).toBe(true);
  });
});
