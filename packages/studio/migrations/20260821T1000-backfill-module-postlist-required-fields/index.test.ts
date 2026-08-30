import { BRAND_VARIANT } from '@blog/config/constants';
import { at, set } from 'sanity/migrate';

import { backfillPostListRequiredFields } from './index';

describe(backfillPostListRequiredFields, () => {
  it('backfills both title and brandVariant when neither is set', () => {
    const result = backfillPostListRequiredFields({});

    expect(result).toEqual([
      at('title', set('Blog Archive')),
      at('brandVariant', set(BRAND_VARIANT.PRIMARY)),
    ]);
  });

  it('backfills both when they are explicitly null (the live postList-blog shape)', () => {
    const result = backfillPostListRequiredFields({
      title: null,
      brandVariant: null,
    });

    expect(result).toEqual([
      at('title', set('Blog Archive')),
      at('brandVariant', set(BRAND_VARIANT.PRIMARY)),
    ]);
  });

  it('backfills only title when brandVariant is already set', () => {
    const result = backfillPostListRequiredFields({
      brandVariant: BRAND_VARIANT.SECONDARY,
    });

    expect(result).toEqual([at('title', set('Blog Archive'))]);
  });

  it('backfills only brandVariant when title is already set', () => {
    const result = backfillPostListRequiredFields({
      title: 'Editor-chosen title',
    });

    expect(result).toEqual([at('brandVariant', set(BRAND_VARIANT.PRIMARY))]);
  });

  it('is idempotent — a document with both fields already set is left alone', () => {
    const result = backfillPostListRequiredFields({
      title: 'Editor-chosen title',
      brandVariant: BRAND_VARIANT.SECONDARY,
    });

    expect(result).toBeUndefined();
  });
});
