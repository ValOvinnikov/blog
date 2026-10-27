import { BRAND_VARIANT } from '@blog/config/constants';
import { faker } from '@faker-js/faker';
import { at, set } from 'sanity/migrate';

import { backfillPostListRequiredFields } from './index';

faker.seed(15);

const BACKFILL_TITLE = 'Blog Archive';
const MOCK_TITLE = faker.lorem.words();

describe(backfillPostListRequiredFields, () => {
  it.each([
    ['unset', {}],
    ['null', { title: null, brandVariant: null }],
  ])('backfills title and brandVariant when both are %s', (_label, doc) => {
    const result = backfillPostListRequiredFields(doc);

    expect(result).toEqual([
      at('title', set(BACKFILL_TITLE)),
      at('brandVariant', set(BRAND_VARIANT.PRIMARY)),
    ]);
  });

  it('backfills only title when brandVariant is already set', () => {
    const result = backfillPostListRequiredFields({
      brandVariant: BRAND_VARIANT.SECONDARY,
    });

    expect(result).toEqual([at('title', set(BACKFILL_TITLE))]);
  });

  it('backfills only brandVariant when title is already set', () => {
    const result = backfillPostListRequiredFields({ title: MOCK_TITLE });

    expect(result).toEqual([at('brandVariant', set(BRAND_VARIANT.PRIMARY))]);
  });

  it('leaves a document with both fields set alone', () => {
    const result = backfillPostListRequiredFields({
      title: MOCK_TITLE,
      brandVariant: BRAND_VARIANT.SECONDARY,
    });

    expect(result).toBeUndefined();
  });
});
