import { BRAND_VARIANT, DISPLAY_MODE } from '@blog/config';
import {
  mockCtaButtonView,
  mockRawCtaButton,
  mockRawLogoImage,
  mockRawLogoItem,
  mockRawLogoWallModule,
} from '@blog/service/testing/modules/fixtures';
import {
  MOCK_IMAGE_ASSET_ID,
  mockLinkView,
  mockRawExternalLinkDocument,
  mockRawInternalLinkDocument,
} from '@blog/service/testing/shared/fixtures';

import { toLogoWallModule } from './transformer';

const LOGO_NAME = 'Stripe';
const DARK_IMAGE_ASSET_ID = 'image-dark-400x100-svg';
const LOGO_LINK_LABEL = 'Visit site';
const LOGO_LINK_URL = 'https://acme.example.com';

describe(toLogoWallModule, () => {
  it('maps brandVariant and displayMode straight through', () => {
    const raw = mockRawLogoWallModule({
      brandVariant: BRAND_VARIANT.SECONDARY,
      displayMode: DISPLAY_MODE.CAROUSEL,
    });

    const module = toLogoWallModule(raw);

    expect(module.brandVariant).toBe(BRAND_VARIANT.SECONDARY);
    expect(module.displayMode).toBe(DISPLAY_MODE.CAROUSEL);
  });

  it('leaves contentAlignment and layout undefined when unset', () => {
    const raw = mockRawLogoWallModule({
      contentAlignment: null,
      layout: null,
    });

    const module = toLogoWallModule(raw);

    expect(module.contentAlignment).toBeUndefined();
    expect(module.layout).toBeUndefined();
  });

  it('keeps the logos in authored order', () => {
    const keys = ['block-logo-b', 'block-logo-a', 'block-logo-c'];
    const raw = mockRawLogoWallModule({
      logos: keys.map((_key) => mockRawLogoItem({ _key })),
    });

    const module = toLogoWallModule(raw);

    expect(module.logos.map((logo) => logo.id)).toEqual(keys);
  });

  it("builds the image's alt from the logo's name", () => {
    const raw = mockRawLogoWallModule({
      logos: [mockRawLogoItem({ name: LOGO_NAME })],
    });

    const module = toLogoWallModule(raw);

    expect(module.logos[0]?.name).toBe(LOGO_NAME);
    expect(module.logos[0]?.image?.alt).toBe(LOGO_NAME);
  });

  it('yields both images, each with its own aspect ratio, for a dark-background logo', () => {
    const raw = mockRawLogoWallModule({
      logos: [
        mockRawLogoItem({
          name: LOGO_NAME,
          imageDark: {
            asset: {
              _id: DARK_IMAGE_ASSET_ID,
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
      assetId: DARK_IMAGE_ASSET_ID,
      alt: LOGO_NAME,
      dimensions: { aspectRatio: 4 },
    });
  });

  it.each([
    ['no dark-background image', null],
    [
      'a dark-background image with only crop data',
      {
        ...mockRawLogoImage(),
        asset: null,
        crop: {
          _type: 'sanity.imageCrop',
          top: 0.1,
          bottom: 0.1,
          left: 0,
          right: 0,
        },
      },
    ],
  ] as const)(
    'keeps only the main image for a logo with %s',
    (_, imageDark) => {
      const raw = mockRawLogoWallModule({
        logos: [mockRawLogoItem({ imageDark })],
      });

      const [logo] = toLogoWallModule(raw).logos;

      expect(logo?.image.assetId).toBe(MOCK_IMAGE_ASSET_ID);
      expect(logo?.imageDark).toBeUndefined();
    },
  );

  it('resolves a logo link to an ILink', () => {
    const raw = mockRawLogoWallModule({
      logos: [
        mockRawLogoItem({
          link: mockRawExternalLinkDocument({
            label: LOGO_LINK_LABEL,
            url: LOGO_LINK_URL,
            openInNewTab: true,
          }),
        }),
      ],
    });

    const module = toLogoWallModule(raw);

    expect(module.logos[0]?.link).toEqual(
      mockLinkView({
        label: LOGO_LINK_LABEL,
        href: LOGO_LINK_URL,
        target: '_blank',
      }),
    );
  });

  it('keeps a logo whose link cannot resolve, dropping only the link', () => {
    const raw = mockRawLogoWallModule({
      logos: [
        mockRawLogoItem({
          link: mockRawInternalLinkDocument(),
        }),
      ],
    });

    const module = toLogoWallModule(raw);

    expect(module.logos[0]?.id).toBe('block-logo-1');
    expect(module.logos[0]?.link).toBeUndefined();
  });

  it('maps authored ctaButtons', () => {
    const raw = mockRawLogoWallModule({
      ctaButtons: [mockRawCtaButton()],
    });

    const module = toLogoWallModule(raw);

    expect(module.ctaButtons).toHaveLength(1);
    expect(module.ctaButtons[0]).toEqual(mockCtaButtonView());
  });
});
