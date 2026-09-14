import { DISPLAY_MODE } from '@blog/config/constants';
import { postLatestSchema } from '@blog/studio/schema-types/modules/post-latest/post-latest';
import {
  getCustomValidator,
  getRecordedValidators,
  type TRecordedValidator,
} from '@blog/studio/testing/create-mock-validation-rule';
import type { SanityDocument } from 'sanity';

type TDocFn = (document: SanityDocument | undefined) => string | true;

const getDocumentValidators = (): TRecordedValidator<TDocFn>[] =>
  getRecordedValidators<TDocFn>(postLatestSchema);

const getField = (name: string) => {
  const field = postLatestSchema.fields?.find(
    (field): field is typeof field & { name: string } =>
      'name' in field && field.name === name,
  );

  if (!field) {
    throw new Error(`Expected postLatestSchema to define a "${name}" field.`);
  }

  return field;
};

describe('postLatestSchema contentAlignment field', () => {
  it('includes a contentAlignment field', () => {
    expect(getField('contentAlignment')).toBeDefined();
  });
});

describe('postLatestSchema showImages field', () => {
  it('includes a showImages field', () => {
    expect(getField('showImages')).toBeDefined();
  });
});

describe('postLatestSchema headingBlock field', () => {
  it('blocks publish on an empty heading', () => {
    const customFn = getCustomValidator<
      (value: { heading?: string } | undefined) => string | true
    >(getField('headingBlock'));

    expect(customFn(undefined)).toBe('Heading is required.');
    expect(customFn({ heading: 'Latest posts' })).toBe(true);
  });
});

describe('postLatestSchema displayMode field', () => {
  it('is emitted immediately after showImages', () => {
    const names =
      postLatestSchema.fields
        ?.map((field) => ('name' in field ? field.name : undefined))
        .filter((name): name is string => Boolean(name)) ?? [];
    const showImagesIndex = names.indexOf('showImages');
    const displayModeIndex = names.indexOf('displayMode');

    expect(showImagesIndex).toBeGreaterThanOrEqual(0);
    expect(displayModeIndex).toBe(showImagesIndex + 1);
  });

  it('defaults to GRID', () => {
    const field = getField('displayMode');

    expect(field.initialValue).toBe(DISPLAY_MODE.GRID);
  });

  it('defines no validation rule', () => {
    const field = getField('displayMode');

    expect(
      'validation' in field ? field.validation : undefined,
    ).toBeUndefined();
  });
});

describe('postLatestSchema document validation', () => {
  it('registers one warning-level rule', () => {
    const validators = getDocumentValidators();

    expect(validators).toHaveLength(1);
    expect(validators[0]!.level).toBe('warning');
  });

  it('warns when Carousel is chosen with a limit under four', () => {
    const [validateCarousel] = getDocumentValidators();

    expect(
      validateCarousel!.fn({
        displayMode: DISPLAY_MODE.CAROUSEL,
        limit: 3,
      } as unknown as SanityDocument),
    ).toBe(
      'Fewer than four posts fit on one row on wide screens, so this carousel has nothing to scroll there. Raise the limit, or use the grid.',
    );
  });

  it('is silent when Carousel is chosen with a limit of four', () => {
    const [validateCarousel] = getDocumentValidators();

    expect(
      validateCarousel!.fn({
        displayMode: DISPLAY_MODE.CAROUSEL,
        limit: 4,
      } as unknown as SanityDocument),
    ).toBe(true);
  });

  it('is silent under Grid regardless of limit', () => {
    const [validateCarousel] = getDocumentValidators();

    expect(
      validateCarousel!.fn({
        displayMode: DISPLAY_MODE.GRID,
        limit: 1,
      } as unknown as SanityDocument),
    ).toBe(true);
  });
});
