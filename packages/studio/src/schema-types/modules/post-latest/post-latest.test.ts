import { DISPLAY_MODE } from '@blog/config/constants';
import { postLatestSchema } from '@blog/studio/schema-types/modules/post-latest/post-latest';
import {
  getRecordedValidators,
  type TRecordedValidator,
} from '@blog/studio/testing/create-mock-validation-rule';
import type { SanityDocument } from 'sanity';

type TDocFn = (document: SanityDocument | undefined) => string | true;

const getDocumentValidators = (): TRecordedValidator<TDocFn>[] =>
  getRecordedValidators<TDocFn>(postLatestSchema);

describe('postLatestSchema document validation', () => {
  it.each([
    [
      DISPLAY_MODE.CAROUSEL,
      3,
      'Fewer than four posts fit on one row on wide screens, so this carousel has nothing to scroll there. Raise the limit, or use the grid.',
    ],
    [DISPLAY_MODE.CAROUSEL, 4, true],
    [DISPLAY_MODE.GRID, 1, true],
  ])('displayMode %s, limit %j → %j', (displayMode, limit, expected) => {
    const [validateCarousel] = getDocumentValidators();

    expect(
      validateCarousel!.fn({
        displayMode,
        limit,
      } as unknown as SanityDocument),
    ).toBe(expected);
  });
});
