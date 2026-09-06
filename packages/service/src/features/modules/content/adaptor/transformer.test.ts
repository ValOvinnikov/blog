import { BRAND_VARIANT, CONTAINER_WIDTH, SPACING_SCALE } from '@blog/config';
import { makeRawContentModule } from '@blog/service/testing/modules/fixtures';
import { makeTenant } from '@blog/service/testing/tenant';

import { toContentModule } from './transformer';

const tenant = makeTenant();

describe('toContentModule', () => {
  it('maps body straight through (schema-required)', () => {
    const raw = makeRawContentModule();

    const module = toContentModule(raw, tenant);

    expect(module.body).toHaveLength(1);
  });

  it('maps brandVariant straight through', () => {
    const raw = makeRawContentModule({ brandVariant: BRAND_VARIANT.SECONDARY });

    const module = toContentModule(raw, tenant);

    expect(module.brandVariant).toBe(BRAND_VARIANT.SECONDARY);
  });

  it('maps a fully-authored layout object 1:1', () => {
    const raw = makeRawContentModule({
      layout: {
        spacingTop: SPACING_SCALE.XL,
        spacingBottom: SPACING_SCALE.NONE,
        containerWidth: CONTAINER_WIDTH.FULL,
        dividerTop: false,
        dividerBottom: true,
      },
    });

    const module = toContentModule(raw, tenant);

    expect(module.layout).toEqual({
      spacingTop: SPACING_SCALE.XL,
      spacingBottom: SPACING_SCALE.NONE,
      containerWidth: CONTAINER_WIDTH.FULL,
      dividerTop: false,
      dividerBottom: true,
    });
  });

  it('leaves layout undefined when the field is unset (no faked default)', () => {
    const raw = makeRawContentModule({ layout: null });

    const module = toContentModule(raw, tenant);

    expect(module.layout).toBeUndefined();
  });

  it('resolves a bodyImage block into an image view-model, keeping layout', () => {
    const raw = makeRawContentModule({
      body: [
        {
          _type: 'bodyImage',
          _key: 'image-1',
          asset: {
            _id: 'image-abc123-800x600-jpg',
            metadata: {
              lqip: null,
              dimensions: { width: 800, height: 600, aspectRatio: 1.333 },
            },
          },
          hotspot: null,
          crop: null,
          alt: 'A diagram',
          layout: 'INLINE',
        },
      ],
    });

    const module = toContentModule(raw, tenant);

    expect(module.body[0]).toEqual({
      _type: 'bodyImage',
      _key: 'image-1',
      layout: 'INLINE',
      image: expect.objectContaining({ assetId: 'image-abc123-800x600-jpg' }),
    });
  });

  it('keeps a bodyImage block whose asset never resolved, with image undefined', () => {
    const raw = makeRawContentModule({
      body: [
        {
          _type: 'bodyImage',
          _key: 'image-1',
          asset: null,
          hotspot: null,
          crop: null,
          alt: 'A diagram',
          layout: null,
        },
      ],
    });

    const module = toContentModule(raw, tenant);

    expect(module.body).toHaveLength(1);
    expect(module.body[0]).toMatchObject({
      _type: 'bodyImage',
      image: undefined,
    });
  });
});
