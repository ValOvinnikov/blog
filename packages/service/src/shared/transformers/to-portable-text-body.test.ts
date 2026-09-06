import { makeTenant } from '@blog/service/testing/tenant';

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
    const result = toPortableTextBody(makeRawBody(), makeTenant());

    expect(result).toEqual([
      {
        _type: 'bodyImage',
        _key: 'image-1',
        layout: 'FULL_BLEED',
        image: {
          assetId: 'image-abc123-800x600-jpg',
          alt: 'Alt text',
          cdnBaseUrl: 'https://cdn.sanity.io/images/tenant-a/production/',
          hotspot: undefined,
          crop: undefined,
          lqip: 'data:image/png;base64,abc123',
          dimensions: { width: 800, height: 600, aspectRatio: 1.333 },
        },
      },
    ]);
  });

  it('derives the image cdnBaseUrl from the given tenant, not a shared default', () => {
    const raw = makeRawBody();

    const tenantA = toPortableTextBody(
      raw,
      makeTenant({ projectId: 'proj-a', dataset: 'production' }),
    );
    const tenantB = toPortableTextBody(
      raw,
      makeTenant({ projectId: 'proj-b', dataset: 'staging' }),
    );

    const [imageA] = tenantA;
    const [imageB] = tenantB;
    if (
      !imageA ||
      !imageB ||
      imageA._type !== 'bodyImage' ||
      imageB._type !== 'bodyImage'
    ) {
      throw new Error('expected bodyImage blocks');
    }

    expect(imageA.image?.cdnBaseUrl).toBe(
      'https://cdn.sanity.io/images/proj-a/production/',
    );
    expect(imageB.image?.cdnBaseUrl).toBe(
      'https://cdn.sanity.io/images/proj-b/staging/',
    );
    expect(imageA.image?.cdnBaseUrl).not.toBe(imageB.image?.cdnBaseUrl);
  });

  it('keeps a bodyImage block whose asset never resolved, with image undefined', () => {
    const raw = makeRawBody({ asset: null });

    const result = toPortableTextBody(raw, makeTenant());

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      _type: 'bodyImage',
      _key: 'image-1',
      layout: 'FULL_BLEED',
      image: undefined,
    });
  });

  it('maps a missing layout to undefined (no faked default)', () => {
    const raw = makeRawBody({ layout: null });

    const result = toPortableTextBody(raw, makeTenant());

    expect(result[0]).toMatchObject({ layout: undefined });
  });

  it('passes non-bodyImage blocks through unchanged', () => {
    const block = { _type: 'block' as const, _key: 'block-1' };
    const raw = [block] as TRawPortableTextBody;

    const result = toPortableTextBody(raw, makeTenant());

    expect(result).toEqual([block]);
  });
});
