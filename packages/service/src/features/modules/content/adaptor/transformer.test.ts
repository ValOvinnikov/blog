import { BRAND_VARIANT, CONTAINER_WIDTH, SPACING_SCALE } from '@blog/config';
import { makeRawContentModule } from '@blog/service/testing/modules/fixtures';

import { toContentModule } from './transformer';

describe('toContentModule', () => {
  it('maps body straight through (schema-required)', () => {
    const raw = makeRawContentModule();

    const module = toContentModule(raw);

    expect(module.body).toHaveLength(1);
  });

  it('maps brandVariant straight through', () => {
    const raw = makeRawContentModule({ brandVariant: BRAND_VARIANT.SECONDARY });

    const module = toContentModule(raw);

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

    const module = toContentModule(raw);

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

    const module = toContentModule(raw);

    expect(module.layout).toBeUndefined();
  });

  it('preserves the optional layout field on a bodyImage body block', () => {
    const raw = makeRawContentModule({
      body: [
        {
          _type: 'bodyImage',
          _key: 'image-1',
          asset: undefined,
          media: undefined,
          hotspot: undefined,
          crop: undefined,
          alt: 'A diagram',
          layout: 'INLINE',
        },
      ],
    });

    const module = toContentModule(raw);

    expect(module.body[0]).toMatchObject({
      _type: 'bodyImage',
      layout: 'INLINE',
    });
  });
});
