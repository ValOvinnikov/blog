import { makeRawSharedLink } from '@blog/service/testing/shared/fixtures';

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

  it('passes a text block with no markDefs through unchanged', () => {
    const block = {
      _type: 'block' as const,
      _key: 'block-1',
      markDefs: null,
    };
    const raw = [block] as TRawPortableTextBody;

    const result = toPortableTextBody(raw);

    expect(result).toEqual([{ ...block, markDefs: undefined }]);
  });

  it('leaves an href-based link mark untouched', () => {
    const raw = [
      {
        _type: 'block',
        _key: 'block-1',
        markDefs: [{ _type: 'link', _key: 'mark-1', href: 'https://x.test' }],
      },
    ] as unknown as TRawPortableTextBody;

    const result = toPortableTextBody(raw);

    expect(result[0]).toMatchObject({
      markDefs: [{ _type: 'link', _key: 'mark-1', href: 'https://x.test' }],
    });
  });

  it('resolves a sharedLinkAnnotation mark to a view-model ILink', () => {
    const raw = [
      {
        _type: 'block',
        _key: 'block-1',
        markDefs: [
          {
            _key: 'mark-1',
            _type: 'sharedLinkAnnotation',
            link: makeRawSharedLink({
              label: 'Read more',
              url: 'https://example.com',
            }),
          },
        ],
      },
    ] as TRawPortableTextBody;

    const result = toPortableTextBody(raw);

    expect(result[0]).toMatchObject({
      markDefs: [
        {
          _key: 'mark-1',
          _type: 'sharedLinkAnnotation',
          link: {
            label: 'Read more',
            href: 'https://example.com',
            target: undefined,
            platform: undefined,
          },
        },
      ],
    });
  });

  it('resolves a sharedLinkAnnotation mark to link: undefined when the reference is dangling', () => {
    const raw = [
      {
        _type: 'block',
        _key: 'block-1',
        markDefs: [
          { _key: 'mark-1', _type: 'sharedLinkAnnotation', link: null },
        ],
      },
    ] as TRawPortableTextBody;

    const result = toPortableTextBody(raw);

    expect(result[0]).toMatchObject({
      markDefs: [
        { _key: 'mark-1', _type: 'sharedLinkAnnotation', link: undefined },
      ],
    });
  });

  it('resolves markDefs inside an aside block body', () => {
    const raw = [
      {
        _type: 'aside',
        _key: 'aside-1',
        kind: 'WHY_NOT',
        body: [
          {
            _type: 'block',
            _key: 'aside-block-1',
            markDefs: [
              {
                _key: 'mark-1',
                _type: 'sharedLinkAnnotation',
                link: makeRawSharedLink({ url: 'https://example.com/aside' }),
              },
            ],
          },
        ],
      },
    ] as unknown as TRawPortableTextBody;

    const result = toPortableTextBody(raw);

    expect(result[0]).toMatchObject({
      _type: 'aside',
      body: [
        {
          markDefs: [
            {
              _key: 'mark-1',
              _type: 'sharedLinkAnnotation',
              link: { href: 'https://example.com/aside' },
            },
          ],
        },
      ],
    });
  });

  it('leaves an aside block with no body untouched', () => {
    const raw = [
      { _type: 'aside', _key: 'aside-1', kind: 'CONTEXT', body: null },
    ] as unknown as TRawPortableTextBody;

    const result = toPortableTextBody(raw);

    expect(result[0]).toEqual({
      _type: 'aside',
      _key: 'aside-1',
      kind: 'CONTEXT',
      body: undefined,
    });
  });
});
