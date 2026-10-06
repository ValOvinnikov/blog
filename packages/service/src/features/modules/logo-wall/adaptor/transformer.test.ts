import { BRAND_VARIANT, DISPLAY_MODE, LINK_TYPE } from '@blog/config';
import {
  makeRawCtaButton,
  makeRawLogoImage,
  makeRawLogoItem,
  makeRawLogoWallModule,
} from '@blog/service/testing/modules/fixtures';

import { toLogoWallModule } from './transformer';

describe('toLogoWallModule', () => {
  it('maps brandVariant and displayMode straight through', () => {
    const raw = makeRawLogoWallModule({
      brandVariant: BRAND_VARIANT.SECONDARY,
      displayMode: DISPLAY_MODE.CAROUSEL,
    });

    const module = toLogoWallModule(raw);

    expect(module.brandVariant).toBe(BRAND_VARIANT.SECONDARY);
    expect(module.displayMode).toBe(DISPLAY_MODE.CAROUSEL);
  });

  it('leaves contentAlignment and layout undefined when unset (no faked default)', () => {
    const raw = makeRawLogoWallModule({
      contentAlignment: null,
      layout: null,
    });

    const module = toLogoWallModule(raw);

    expect(module.contentAlignment).toBeUndefined();
    expect(module.layout).toBeUndefined();
  });

  it('keeps the logos in authored order', () => {
    const raw = makeRawLogoWallModule({
      logos: [
        makeRawLogoItem({ _key: 'block-logo-b' }),
        makeRawLogoItem({ _key: 'block-logo-a' }),
        makeRawLogoItem({ _key: 'block-logo-c' }),
      ],
    });

    const module = toLogoWallModule(raw);

    expect(module.logos.map((logo) => logo.id)).toEqual([
      'block-logo-b',
      'block-logo-a',
      'block-logo-c',
    ]);
  });

  it('transforms a module with fewer than three logos', () => {
    const raw = makeRawLogoWallModule({
      logos: [makeRawLogoItem(), makeRawLogoItem({ _key: 'block-logo-2' })],
    });

    const module = toLogoWallModule(raw);

    expect(module.logos.map((logo) => logo.id)).toEqual([
      'block-logo-1',
      'block-logo-2',
    ]);
  });

  it("builds the image's alt from the logo's name", () => {
    const raw = makeRawLogoWallModule({
      logos: [makeRawLogoItem({ name: 'Stripe' })],
    });

    const module = toLogoWallModule(raw);

    expect(module.logos[0]?.name).toBe('Stripe');
    expect(module.logos[0]?.image?.alt).toBe('Stripe');
  });

  it('yields both images, each with its own aspect ratio, when a logo has a dark-background image', () => {
    const raw = makeRawLogoWallModule({
      logos: [
        makeRawLogoItem({
          name: 'Stripe',
          imageDark: {
            asset: {
              _id: 'image-dark-400x100-svg',
              metadata: {
                lqip: null,
                dimensions: { width: 400, height: 100, aspectRatio: 4 },
              },
            },
            hotspot: null,
            crop: null,
          },
        }),
      ],
    });

    const [logo] = toLogoWallModule(raw).logos;

    expect(logo?.image.dimensions?.aspectRatio).toBe(1.333);
    expect(logo?.imageDark).toMatchObject({
      assetId: 'image-dark-400x100-svg',
      alt: 'Stripe',
      dimensions: { aspectRatio: 4 },
    });
  });

  it('leaves imageDark undefined when a logo has none', () => {
    const raw = makeRawLogoWallModule({
      logos: [makeRawLogoItem({ imageDark: null })],
    });

    const [logo] = toLogoWallModule(raw).logos;

    expect(logo?.image.assetId).toBe('image-abc123-800x600-jpg');
    expect(logo?.imageDark).toBeUndefined();
  });

  it('falls back to the main image when imageDark holds only crop and hotspot data', () => {
    const raw = makeRawLogoWallModule({
      logos: [
        makeRawLogoItem({
          imageDark: {
            ...makeRawLogoImage(),
            asset: null,
            crop: {
              _type: 'sanity.imageCrop',
              top: 0.1,
              bottom: 0.1,
              left: 0,
              right: 0,
            },
          },
        }),
      ],
    });

    const [logo] = toLogoWallModule(raw).logos;

    expect(logo?.image.assetId).toBe('image-abc123-800x600-jpg');
    expect(logo?.imageDark).toBeUndefined();
  });

  it('resolves a logo link to an ILink', () => {
    const raw = makeRawLogoWallModule({
      logos: [
        makeRawLogoItem({
          link: {
            label: 'Visit site',
            linkType: LINK_TYPE.EXTERNAL,
            url: 'https://acme.example.com',
            internalReference: null,
            openInNewTab: true,
          },
        }),
        makeRawLogoItem({ _key: 'block-logo-2' }),
        makeRawLogoItem({ _key: 'block-logo-3' }),
      ],
    });

    const module = toLogoWallModule(raw);

    expect(module.logos[0]?.link).toEqual({
      label: 'Visit site',
      href: 'https://acme.example.com',
      target: '_blank',
      platform: undefined,
      ariaLabel: undefined,
    });
  });

  it('leaves a logo link undefined when the logo has none', () => {
    const raw = makeRawLogoWallModule({
      logos: [
        makeRawLogoItem({ link: null }),
        makeRawLogoItem({ _key: 'block-logo-2' }),
        makeRawLogoItem({ _key: 'block-logo-3' }),
      ],
    });

    const module = toLogoWallModule(raw);

    expect(module.logos[0]?.link).toBeUndefined();
  });

  it('keeps a logo whose link cannot resolve, dropping only the link', () => {
    const raw = makeRawLogoWallModule({
      logos: [
        makeRawLogoItem({
          _key: 'block-logo-1',
          link: {
            label: 'Broken',
            linkType: LINK_TYPE.INTERNAL,
            internalReference: null,
            url: null,
            openInNewTab: null,
          },
        }),
        makeRawLogoItem({ _key: 'block-logo-2' }),
        makeRawLogoItem({ _key: 'block-logo-3' }),
      ],
    });

    const module = toLogoWallModule(raw);

    expect(module.logos[0]?.id).toBe('block-logo-1');
    expect(module.logos[0]?.link).toBeUndefined();
  });

  it('returns an empty array for an absent ctaButtons field', () => {
    const raw = makeRawLogoWallModule({ ctaButtons: null });

    const module = toLogoWallModule(raw);

    expect(module.ctaButtons).toEqual([]);
  });

  it('maps authored ctaButtons', () => {
    const raw = makeRawLogoWallModule({
      ctaButtons: [makeRawCtaButton()],
    });

    const module = toLogoWallModule(raw);

    expect(module.ctaButtons).toHaveLength(1);
    expect(module.ctaButtons[0]).toMatchObject({
      link: { label: 'Subscribe', href: '/newsletter' },
    });
  });
});
