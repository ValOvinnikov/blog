import { makeRawPortableTextMarkDef } from '@blog/service/testing/shared/fixtures';

import {
  toPortableTextBody,
  type TRawPortableTextBody,
} from './to-portable-text-body';

function makeRawBody(
  overrides: Partial<TRawPortableTextBody[number]> = {},
): TRawPortableTextBody {
  return [
    {
      _type: 'bodyImage',
      _key: 'image-1',
      asset: {
        _id: 'image-abc123-800x600-jpg',
        metadata: {
          lqip: 'data:image/png;base64,abc123',
          dimensions: { width: 800, height: 600, aspectRatio: 1.333 },
        },
      },
      hotspot: null,
      crop: null,
      alt: 'Alt text',
      layout: 'FULL_BLEED',
      ...overrides,
    } as TRawPortableTextBody[number],
  ];
}

describe('toPortableTextBody', () => {
  it('resolves a bodyImage block into an image view-model', () => {
    const result = toPortableTextBody(makeRawBody());

    expect(result).toEqual([
      {
        _type: 'bodyImage',
        _key: 'image-1',
        layout: 'FULL_BLEED',
        image: {
          assetId: 'image-abc123-800x600-jpg',
          alt: 'Alt text',
          hotspot: undefined,
          crop: undefined,
          lqip: 'data:image/png;base64,abc123',
          dimensions: { width: 800, height: 600, aspectRatio: 1.333 },
        },
      },
    ]);
  });

  it('keeps a bodyImage block whose asset never resolved, with image undefined', () => {
    const raw = makeRawBody({ asset: null });

    const result = toPortableTextBody(raw);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      _type: 'bodyImage',
      _key: 'image-1',
      layout: 'FULL_BLEED',
      image: undefined,
    });
  });

  it('maps a bodyImage block with no alt text to an empty string, not undefined', () => {
    const raw = makeRawBody({ alt: null });

    const result = toPortableTextBody(raw);

    expect(result[0]).toMatchObject({
      image: expect.objectContaining({ alt: '' }),
    });
  });

  it('maps a missing layout to undefined (no faked default)', () => {
    const raw = makeRawBody({ layout: null });

    const result = toPortableTextBody(raw);

    expect(result[0]).toMatchObject({ layout: undefined });
  });

  it('passes a code block through unchanged', () => {
    const block = { _type: 'code' as const, _key: 'code-1', code: 'a();' };
    const raw = [block] as TRawPortableTextBody;

    const result = toPortableTextBody(raw);

    expect(result).toEqual([block]);
  });

  it('resolves a plain block with no markDefs, leaving markDefs undefined', () => {
    const block = { _type: 'block' as const, _key: 'block-1', markDefs: null };
    const raw = [block] as TRawPortableTextBody;

    const result = toPortableTextBody(raw);

    expect(result).toEqual([{ ...block, markDefs: undefined }]);
  });

  it("resolves a block's linkRef mark to its link document href", () => {
    const raw = [
      {
        _type: 'block' as const,
        _key: 'block-1',
        markDefs: [makeRawPortableTextMarkDef()],
      },
    ] as TRawPortableTextBody;

    const result = toPortableTextBody(raw);

    expect(result[0]).toMatchObject({
      markDefs: [
        {
          _key: 'mark-1',
          _type: 'linkRef',
          link: { href: 'https://example.com' },
        },
      ],
    });
  });

  it('degrades a dangling linkRef mark to an absent link rather than throwing', () => {
    const raw = [
      {
        _type: 'block' as const,
        _key: 'block-1',
        markDefs: [makeRawPortableTextMarkDef({ link: null })],
      },
    ] as TRawPortableTextBody;

    expect(() => toPortableTextBody(raw)).not.toThrow();
    const result = toPortableTextBody(raw);
    expect(result[0]).toMatchObject({
      markDefs: [{ _key: 'mark-1', link: undefined }],
    });
  });

  it("resolves an aside block's nested body markDefs the same way", () => {
    const raw = [
      {
        _type: 'aside' as const,
        _key: 'aside-1',
        kind: 'CONTEXT',
        body: [
          {
            _type: 'block' as const,
            _key: 'aside-block-1',
            markDefs: [makeRawPortableTextMarkDef()],
          },
        ],
      },
    ] as TRawPortableTextBody;

    const result = toPortableTextBody(raw);

    expect(result[0]).toMatchObject({
      _type: 'aside',
      body: [
        {
          _key: 'aside-block-1',
          markDefs: [{ link: { href: 'https://example.com' } }],
        },
      ],
    });
  });

  it('leaves an aside block with no body blocks undefined (no faked default)', () => {
    const raw = [
      { _type: 'aside' as const, _key: 'aside-1', kind: 'CONTEXT', body: null },
    ] as TRawPortableTextBody;

    const result = toPortableTextBody(raw);

    expect(result[0]).toMatchObject({ body: undefined });
  });
});
