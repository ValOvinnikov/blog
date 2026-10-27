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
  mockSanityImageView,
} from '@blog/service/testing/shared/fixtures';
import { faker } from '@faker-js/faker';

import { toLogoWallModule } from './transformer';

faker.seed(6014);

const MOCK_LOGO_NAME = faker.company.name();
const MOCK_LOGO_KEY = faker.string.uuid();
const MOCK_DARK_IMAGE_ASSET_ID = faker.string.uuid();
const MOCK_DARK_IMAGE_WIDTH = 400;
const MOCK_DARK_IMAGE_HEIGHT = 100;
const MOCK_DARK_ASPECT_RATIO = MOCK_DARK_IMAGE_WIDTH / MOCK_DARK_IMAGE_HEIGHT;
const MOCK_LOGO_LINK_LABEL = faker.lorem.words(2);
const MOCK_LOGO_LINK_URL = faker.internet.url();

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
    const keys = [
      faker.string.uuid(),
      faker.string.uuid(),
      faker.string.uuid(),
    ];
    const raw = mockRawLogoWallModule({
      logos: keys.map((_key) => mockRawLogoItem({ _key })),
    });

    const module = toLogoWallModule(raw);

    expect(module.logos.map((logo) => logo.id)).toEqual(keys);
  });

  it("builds the image's alt from the logo's name", () => {
    const raw = mockRawLogoWallModule({
      logos: [mockRawLogoItem({ name: MOCK_LOGO_NAME })],
    });

    const module = toLogoWallModule(raw);

    expect(module.logos[0]?.name).toBe(MOCK_LOGO_NAME);
    expect(module.logos[0]?.image?.alt).toBe(MOCK_LOGO_NAME);
  });

  it('yields both images, each with its own aspect ratio, for a dark-background logo', () => {
    const raw = mockRawLogoWallModule({
      logos: [
        mockRawLogoItem({
          name: MOCK_LOGO_NAME,
          imageDark: {
            asset: {
              _id: MOCK_DARK_IMAGE_ASSET_ID,
              metadata: {
                lqip: null,
                dimensions: {
                  width: MOCK_DARK_IMAGE_WIDTH,
                  height: MOCK_DARK_IMAGE_HEIGHT,
                  aspectRatio: MOCK_DARK_ASPECT_RATIO,
                },
              },
            },
            hotspot: null,
            crop: null,
          },
        }),
      ],
    });

    const [logo] = toLogoWallModule(raw).logos;

    expect(logo?.image.dimensions?.aspectRatio).toBe(
      mockSanityImageView().dimensions?.aspectRatio,
    );
    expect(logo?.imageDark).toMatchObject({
      assetId: MOCK_DARK_IMAGE_ASSET_ID,
      alt: MOCK_LOGO_NAME,
      dimensions: { aspectRatio: MOCK_DARK_ASPECT_RATIO },
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
            label: MOCK_LOGO_LINK_LABEL,
            url: MOCK_LOGO_LINK_URL,
            openInNewTab: true,
          }),
        }),
      ],
    });

    const module = toLogoWallModule(raw);

    expect(module.logos[0]?.link).toEqual(
      mockLinkView({
        label: MOCK_LOGO_LINK_LABEL,
        href: MOCK_LOGO_LINK_URL,
        target: '_blank',
      }),
    );
  });

  it('keeps a logo whose link cannot resolve, dropping only the link', () => {
    const raw = mockRawLogoWallModule({
      logos: [
        mockRawLogoItem({
          _key: MOCK_LOGO_KEY,
          link: mockRawInternalLinkDocument(),
        }),
      ],
    });

    const module = toLogoWallModule(raw);

    expect(module.logos[0]?.id).toBe(MOCK_LOGO_KEY);
    expect(module.logos[0]?.link).toBeUndefined();
  });

  it('maps authored ctaButtons', () => {
    const raw = mockRawLogoWallModule({
      ctaButtons: [mockRawCtaButton()],
    });

    const module = toLogoWallModule(raw);

    expect(module.ctaButtons).toEqual([mockCtaButtonView()]);
  });
});
