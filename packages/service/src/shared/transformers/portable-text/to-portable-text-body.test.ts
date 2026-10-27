import {
  ASIDE_KIND,
  IMAGE_LAYOUT,
  PORTABLE_TEXT_BLOCK_TYPE,
} from '@blog/config/constants';
import {
  MOCK_BODY_IMAGE_KEY,
  MOCK_EXTERNAL_URL,
  mockRawBodyImageBlock,
  mockRawPortableTextMarkDef,
  mockSanityImageView,
} from '@blog/service/testing/shared/fixtures';
import { faker } from '@faker-js/faker';

import {
  toPortableTextBody,
  type TRawPortableTextBody,
} from './to-portable-text-body';

faker.seed(6018);

const MOCK_ASIDE_KEY = faker.string.uuid();
const MOCK_BLOCK_KEY = faker.string.uuid();
const MOCK_MARK_KEY = faker.string.uuid();
const MOCK_CODE_KEY = faker.string.uuid();
const MOCK_CODE = faker.lorem.word();

const MOCK_RESOLVED_BLOCK = {
  _type: 'block',
  _key: MOCK_BLOCK_KEY,
  children: [],
  markDefs: [
    {
      _key: MOCK_MARK_KEY,
      _type: PORTABLE_TEXT_BLOCK_TYPE.LINK_REF,
      link: { href: MOCK_EXTERNAL_URL, target: undefined },
    },
  ],
};

function mockRawLinkedBlock() {
  return {
    _type: 'block' as const,
    _key: MOCK_BLOCK_KEY,
    markDefs: [mockRawPortableTextMarkDef({ _key: MOCK_MARK_KEY })],
  };
}

function mockRawAsideBlock(body: unknown) {
  return {
    _type: PORTABLE_TEXT_BLOCK_TYPE.ASIDE,
    _key: MOCK_ASIDE_KEY,
    kind: ASIDE_KIND.CONTEXT,
    body,
  };
}

describe(toPortableTextBody, () => {
  it.each([
    {
      behaviour: 'resolves a bodyImage block into an image view-model',
      overrides: {},
      layout: IMAGE_LAYOUT.FULL_BLEED,
      image: mockSanityImageView(),
    },
    {
      behaviour: 'keeps a bodyImage block whose asset never resolved',
      overrides: { asset: null },
      layout: IMAGE_LAYOUT.FULL_BLEED,
      image: undefined,
    },
    {
      behaviour: 'maps a missing bodyImage layout to undefined',
      overrides: { layout: null },
      layout: undefined,
      image: mockSanityImageView(),
    },
  ])('$behaviour', ({ overrides, layout, image }) => {
    const result = toPortableTextBody([mockRawBodyImageBlock(overrides)]);

    expect(result).toEqual([
      {
        _type: PORTABLE_TEXT_BLOCK_TYPE.BODY_IMAGE,
        _key: MOCK_BODY_IMAGE_KEY,
        layout,
        image,
      },
    ]);
  });

  it('passes a code block through unchanged', () => {
    const block = {
      _type: 'code' as const,
      _key: MOCK_CODE_KEY,
      code: MOCK_CODE,
    };

    const result = toPortableTextBody([block] as TRawPortableTextBody);

    expect(result).toEqual([block]);
  });

  it('resolves the link marks of a top-level text block', () => {
    const result = toPortableTextBody([
      mockRawLinkedBlock(),
    ] as TRawPortableTextBody);

    expect(result).toEqual([MOCK_RESOLVED_BLOCK]);
  });

  it('resolves the link marks of the text blocks inside an aside', () => {
    const result = toPortableTextBody([
      mockRawAsideBlock([mockRawLinkedBlock()]),
    ] as TRawPortableTextBody);

    expect(result).toEqual([
      { ...mockRawAsideBlock(undefined), body: [MOCK_RESOLVED_BLOCK] },
    ]);
  });

  it('leaves the body of an aside with no blocks undefined', () => {
    const result = toPortableTextBody([
      mockRawAsideBlock(null),
    ] as TRawPortableTextBody);

    expect(result).toEqual([mockRawAsideBlock(undefined)]);
  });
});
