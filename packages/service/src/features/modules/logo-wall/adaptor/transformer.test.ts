import { BRAND_VARIANT, DISPLAY_MODE, LINK_TYPE } from '@blog/config';
import {
  makeRawCtaButton,
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
        makeRawLogoItem({ _id: 'block-logo-b' }),
        makeRawLogoItem({ _id: 'block-logo-a' }),
        makeRawLogoItem({ _id: 'block-logo-c' }),
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
      logos: [makeRawLogoItem(), makeRawLogoItem({ _id: 'block-logo-2' })],
    });

    const module = toLogoWallModule(raw);

    expect(module.logos.map((logo) => logo.id)).toEqual([
      'block-logo-1',
      'block-logo-2',
    ]);
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
        makeRawLogoItem({ _id: 'block-logo-2' }),
        makeRawLogoItem({ _id: 'block-logo-3' }),
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
        makeRawLogoItem({ _id: 'block-logo-2' }),
        makeRawLogoItem({ _id: 'block-logo-3' }),
      ],
    });

    const module = toLogoWallModule(raw);

    expect(module.logos[0]?.link).toBeUndefined();
  });

  it('keeps a logo whose link cannot resolve, dropping only the link', () => {
    const raw = makeRawLogoWallModule({
      logos: [
        makeRawLogoItem({
          _id: 'block-logo-1',
          link: {
            label: 'Broken',
            linkType: LINK_TYPE.INTERNAL,
            internalReference: null,
            url: null,
            openInNewTab: null,
          },
        }),
        makeRawLogoItem({ _id: 'block-logo-2' }),
        makeRawLogoItem({ _id: 'block-logo-3' }),
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
