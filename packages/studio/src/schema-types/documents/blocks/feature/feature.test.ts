import { featureBlockSchema } from '@blog/studio/schema-types/documents/blocks/feature/feature';
import { getCustomValidatorWithLevel } from '@blog/studio/testing/create-mock-validation-rule';
import type { SanityDocument } from 'sanity';

type TDocFn = (document: SanityDocument | undefined) => string | true;

describe('featureBlockSchema document validation', () => {
  const getVisualValidator = () =>
    getCustomValidatorWithLevel<TDocFn>(featureBlockSchema);

  it.each([
    [
      undefined,
      undefined,
      'Add an icon or an image so this card has something to display.',
    ],
    ['CODE', undefined, true],
    [undefined, { asset: {} }, true],
    ['CODE', { asset: {} }, true],
  ])('icon %j, image %j → %j', (icon, image, expected) => {
    const { fn: validate } = getVisualValidator();

    expect(validate({ icon, image } as unknown as SanityDocument)).toBe(
      expected,
    );
  });
});

describe('featureBlockSchema preview', () => {
  const prepare = featureBlockSchema.preview?.prepare;

  if (!prepare) {
    throw new Error('Expected featureBlockSchema to define preview.prepare.');
  }

  it.each([
    [
      { title: 'Fast Builds', linkLabel: 'Learn more', media: undefined },
      { title: 'Fast Builds', subtitle: 'Learn more', media: undefined },
    ],
    [
      { title: 'Fast Builds', linkLabel: undefined, media: undefined },
      { title: 'Fast Builds', subtitle: 'No link', media: undefined },
    ],
    [
      { title: undefined, linkLabel: undefined, media: undefined },
      { title: 'Unknown', subtitle: 'No link', media: undefined },
    ],
    [
      {
        title: 'Fast Builds',
        linkLabel: undefined,
        media: { asset: { _ref: 'image-abc' } },
      },
      {
        title: 'Fast Builds',
        subtitle: 'No link',
        media: { asset: { _ref: 'image-abc' } },
      },
    ],
  ])('prepares %j', (input, expected) => {
    expect(prepare(input)).toEqual(expected);
  });
});
