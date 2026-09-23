import { landingPageSchema } from '@blog/studio/schema-types/documents/pages/landing/landing';
import { getCustomValidator } from '@blog/studio/testing/create-mock-validation-rule';
import { getField } from '@blog/studio/testing/get-field';

type TSlugCustomFn = (value: { current?: string } | undefined) => string | true;

const getSlugCustomValidator = () =>
  getCustomValidator<TSlugCustomFn>(getField(landingPageSchema, 'slug'));

describe('landingPageSchema slug validation', () => {
  it.each(['blog', 'category', 'author', 'api', 'page'])(
    'rejects reserved slug "%s"',
    (reserved) => {
      const customFn = getSlugCustomValidator();

      expect(customFn({ current: reserved })).toBe(
        `"${reserved}" is a reserved path and can't be used as a page slug.`,
      );
    },
  );

  it('passes a non-reserved slug', () => {
    const customFn = getSlugCustomValidator();

    expect(customFn({ current: 'about-us' })).toBe(true);
  });

  it('passes when the slug value is not yet set', () => {
    const customFn = getSlugCustomValidator();

    expect(customFn(undefined)).toBe(true);
  });
});
