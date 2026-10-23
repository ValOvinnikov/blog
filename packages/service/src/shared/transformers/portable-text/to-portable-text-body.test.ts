import {
  ASIDE_KIND,
  IMAGE_LAYOUT,
  PORTABLE_TEXT_BLOCK_TYPE,
} from '@blog/config/constants';
import {
  MOCK_BODY_IMAGE_KEY,
  mockRawBodyImageBlock,
  mockRawPortableTextMarkDef,
  mockSanityImageView,
} from '@blog/service/testing/shared/fixtures';

import {
  toPortableTextBody,
  type TRawPortableTextBody,
} from './to-portable-text-body';

const ASIDE_KEY = 'aside-1';
const ASIDE_BLOCK_KEY = 'aside-block-1';

describe(toPortableTextBody, () => {
  const markDef = mockRawPortableTextMarkDef();

  it.each([
    {
      behaviour: 'resolves a bodyImage block into an image view-model',
      overrides: {},
      image: mockSanityImageView(),
    },
    {
      behaviour:
        'keeps a bodyImage block whose asset never resolved, with image undefined',
      overrides: { asset: null },
      image: undefined,
    },
  ])('$behaviour', ({ overrides, image }) => {
    const result = toPortableTextBody([mockRawBodyImageBlock(overrides)]);

    expect(result).toEqual([
      {
        _type: PORTABLE_TEXT_BLOCK_TYPE.BODY_IMAGE,
        _key: MOCK_BODY_IMAGE_KEY,
        layout: IMAGE_LAYOUT.FULL_BLEED,
        image,
      },
    ]);
  });

  it('maps a missing layout to undefined', () => {
    const result = toPortableTextBody([
      mockRawBodyImageBlock({ layout: null }),
    ]);

    expect(result[0]).toMatchObject({ layout: undefined });
  });

  it('passes a code block through unchanged', () => {
    const block = { _type: 'code' as const, _key: 'code-1', code: 'a();' };

    const result = toPortableTextBody([block] as TRawPortableTextBody);

    expect(result).toEqual([block]);
  });

  it("resolves a block's linkRef mark to its link document href", () => {
    const raw = [
      { _type: 'block' as const, _key: 'block-1', markDefs: [markDef] },
    ] as TRawPortableTextBody;

    const result = toPortableTextBody(raw);

    expect(result[0]).toMatchObject({
      markDefs: [
        {
          _key: markDef._key,
          _type: PORTABLE_TEXT_BLOCK_TYPE.LINK_REF,
          link: { href: markDef.link?.url },
        },
      ],
    });
  });

  it("resolves an aside block's nested body markDefs the same way", () => {
    const raw = [
      {
        _type: PORTABLE_TEXT_BLOCK_TYPE.ASIDE,
        _key: ASIDE_KEY,
        kind: ASIDE_KIND.CONTEXT,
        body: [
          {
            _type: 'block' as const,
            _key: ASIDE_BLOCK_KEY,
            markDefs: [markDef],
          },
        ],
      },
    ] as TRawPortableTextBody;

    const result = toPortableTextBody(raw);

    expect(result[0]).toMatchObject({
      _type: PORTABLE_TEXT_BLOCK_TYPE.ASIDE,
      body: [
        {
          _key: ASIDE_BLOCK_KEY,
          markDefs: [{ link: { href: markDef.link?.url } }],
        },
      ],
    });
  });

  it('leaves an aside block with no body blocks undefined', () => {
    const raw = [
      {
        _type: PORTABLE_TEXT_BLOCK_TYPE.ASIDE,
        _key: ASIDE_KEY,
        kind: ASIDE_KIND.CONTEXT,
        body: null,
      },
    ] as TRawPortableTextBody;

    const result = toPortableTextBody(raw);

    expect(result[0]).toMatchObject({ body: undefined });
  });
});
