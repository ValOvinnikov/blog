import {
  ALIGN,
  BRAND_VARIANT,
  CONTAINER_WIDTH,
  SPACING_SCALE,
} from '@blog/config';
import { makeRawContentModule } from '@blog/service/testing/modules/fixtures';

import { toContentModule } from './transformer';

describe('toContentModule', () => {
  it('maps title and body straight through (both schema-required)', () => {
    const raw = makeRawContentModule({ title: 'About us' });

    const module = toContentModule(raw);

    expect(module.title).toBe('About us');
    expect(module.body).toHaveLength(1);
  });

  it('maps brandVariant straight through', () => {
    const raw = makeRawContentModule({ brandVariant: BRAND_VARIANT.SECONDARY });

    const module = toContentModule(raw);

    expect(module.brandVariant).toBe(BRAND_VARIANT.SECONDARY);
  });

  it('maps a fully-authored appearance object 1:1', () => {
    const raw = makeRawContentModule({
      appearance: {
        spacingTop: SPACING_SCALE.XL,
        spacingBottom: SPACING_SCALE.NONE,
        containerWidth: CONTAINER_WIDTH.FULL,
        align: ALIGN.START,
        divider: false,
      },
    });

    const module = toContentModule(raw);

    expect(module.appearance).toEqual({
      spacingTop: SPACING_SCALE.XL,
      spacingBottom: SPACING_SCALE.NONE,
      containerWidth: CONTAINER_WIDTH.FULL,
      align: ALIGN.START,
      divider: false,
    });
  });

  it('leaves appearance undefined when the field is unset (no faked default)', () => {
    const raw = makeRawContentModule({ appearance: null });

    const module = toContentModule(raw);

    expect(module.appearance).toBeUndefined();
  });

  it('leaves an unset sub-field of a partially-authored appearance object undefined (no faked default)', () => {
    const raw = makeRawContentModule({
      appearance: {
        spacingTop: null,
        spacingBottom: null,
        containerWidth: null,
        align: null,
        divider: null,
      },
    });

    const module = toContentModule(raw);

    expect(module.appearance).toEqual({
      spacingTop: undefined,
      spacingBottom: undefined,
      containerWidth: undefined,
      align: undefined,
      divider: undefined,
    });
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
