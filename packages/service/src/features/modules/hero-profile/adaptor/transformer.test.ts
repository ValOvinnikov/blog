import {
  BRAND_VARIANT,
  CONTENT_ALIGNMENT,
  HERO_VARIANT,
  MEDIA_ORDER,
  SOCIAL_PLATFORMS,
} from '@blog/config';
import {
  MOCK_HERO_EYEBROW,
  MOCK_HERO_IMAGE_ALT,
  mockCtaButtonView,
  mockRawCtaButton,
  mockRawHeroProfileModule,
} from '@blog/service/testing/modules/fixtures';
import {
  MOCK_BIO_BLOCK_KEY,
  mockLinkView,
  mockRawExternalLinkDocument,
  mockRawHeadingBlock,
  mockRawHeroLayout,
  mockRawSanityImage,
} from '@blog/service/testing/shared/fixtures';

import { toHeroProfileModule, type TRawHeroProfileModule } from './transformer';

type TRawProfileAuthor = TRawHeroProfileModule['author'];

const AUTHOR_BIO: TRawProfileAuthor['bio'] = [
  { _type: 'block', _key: MOCK_BIO_BLOCK_KEY, markDefs: null },
];

const AUTHOR_ROLE = 'Staff Engineer';
const AUTHOR_PHOTO_ALT = 'Author photo';
const PROFILE_HEADING = 'Meet the author';
const GITHUB_LINK = { label: 'GitHub', url: 'https://github.com/val' };

function mockRawProfileAuthor(
  overrides: Partial<TRawProfileAuthor> = {},
): TRawProfileAuthor {
  return { ...mockRawHeroProfileModule().author, ...overrides };
}

describe(toHeroProfileModule, () => {
  it('maps brandVariant, variant and headingBlock straight through', () => {
    const raw = mockRawHeroProfileModule({
      brandVariant: BRAND_VARIANT.BRAND_PRIMARY,
      variant: HERO_VARIANT.BANNER,
      headingBlock: mockRawHeadingBlock(PROFILE_HEADING),
    });

    const hero = toHeroProfileModule(raw);

    expect(hero.brandVariant).toBe(BRAND_VARIANT.BRAND_PRIMARY);
    expect(hero.variant).toBe(HERO_VARIANT.BANNER);
    expect(hero.headingBlock).toEqual({
      heading: PROFILE_HEADING,
      supportingText: undefined,
    });
  });

  it.each([
    [
      'the author role when showRole is on, ignoring a typed eyebrow',
      true,
      MOCK_HERO_EYEBROW,
      AUTHOR_ROLE,
      AUTHOR_ROLE,
    ],
    [
      'the typed eyebrow when showRole is off',
      false,
      MOCK_HERO_EYEBROW,
      AUTHOR_ROLE,
      MOCK_HERO_EYEBROW,
    ],
    [
      'undefined when showRole is off and no eyebrow is typed',
      false,
      null,
      null,
      undefined,
    ],
    [
      'undefined when showRole is on and the author has no role',
      true,
      null,
      null,
      undefined,
    ],
  ])('resolves eyebrow to %s', (_, showRole, eyebrow, role, expected) => {
    const raw = mockRawHeroProfileModule({
      showRole,
      eyebrow,
      author: mockRawProfileAuthor({ role }),
    });

    const hero = toHeroProfileModule(raw);

    expect(hero.eyebrow).toBe(expected);
  });

  it.each([
    [
      'maps the author bio blocks when showBio is on',
      true,
      AUTHOR_BIO,
      [
        {
          _type: 'block',
          _key: MOCK_BIO_BLOCK_KEY,
          children: [],
          markDefs: undefined,
        },
      ],
    ],
    [
      'leaves bio undefined when showBio is off, even if the author has one',
      false,
      AUTHOR_BIO,
      undefined,
    ],
    [
      'leaves bio undefined when showBio is on and the author has none',
      true,
      null,
      undefined,
    ],
  ])('%s', (_, showBio, bio, expected) => {
    const raw = mockRawHeroProfileModule({
      showBio,
      author: mockRawProfileAuthor({ bio }),
    });

    const hero = toHeroProfileModule(raw);

    expect(hero.bio).toEqual(expected);
  });

  it("maps avatarName from the author's name, straight through", () => {
    const raw = mockRawHeroProfileModule({
      author: mockRawProfileAuthor({ name: 'Alex Chen' }),
    });

    const hero = toHeroProfileModule(raw);

    expect(hero.avatarName).toBe('Alex Chen');
  });

  it.each([
    [
      "uses the hero's own image over the author photo",
      HERO_VARIANT.SPLIT,
      MOCK_HERO_IMAGE_ALT,
      AUTHOR_PHOTO_ALT,
      MOCK_HERO_IMAGE_ALT,
    ],
    [
      "falls back to the author's photo",
      HERO_VARIANT.SPLIT,
      null,
      AUTHOR_PHOTO_ALT,
      AUTHOR_PHOTO_ALT,
    ],
    [
      'leaves sanityImage undefined when neither has a photo',
      HERO_VARIANT.SPLIT,
      null,
      null,
      undefined,
    ],
    [
      'on Banner, ignores the author photo',
      HERO_VARIANT.BANNER,
      null,
      AUTHOR_PHOTO_ALT,
      undefined,
    ],
    [
      'on Banner, keeps the custom image',
      HERO_VARIANT.BANNER,
      MOCK_HERO_IMAGE_ALT,
      AUTHOR_PHOTO_ALT,
      MOCK_HERO_IMAGE_ALT,
    ],
  ])('%s', (_, variant, imageAlt, authorPhotoAlt, expectedAlt) => {
    const raw = mockRawHeroProfileModule({
      variant,
      image: imageAlt ? mockRawSanityImage(imageAlt) : null,
      author: mockRawProfileAuthor({
        image: authorPhotoAlt ? mockRawSanityImage(authorPhotoAlt) : null,
      }),
    });

    const hero = toHeroProfileModule(raw);

    expect(hero.sanityImage?.alt).toBe(expectedAlt);
  });

  it('maps the author social links when showSocialLinks is on', () => {
    const raw = mockRawHeroProfileModule({
      showSocialLinks: true,
      author: mockRawProfileAuthor({
        socialLinks: [
          {
            platform: SOCIAL_PLATFORMS.GITHUB,
            link: mockRawExternalLinkDocument(GITHUB_LINK),
          },
        ],
      }),
    });

    const hero = toHeroProfileModule(raw);

    expect(hero.socialLinks).toEqual([
      {
        platform: SOCIAL_PLATFORMS.GITHUB,
        link: mockLinkView({ label: GITHUB_LINK.label, href: GITHUB_LINK.url }),
      },
    ]);
  });

  it.each([
    [
      'off, even if the author has links',
      false,
      [
        {
          platform: SOCIAL_PLATFORMS.GITHUB,
          link: mockRawExternalLinkDocument(),
        },
      ],
    ],
    ['on and the author has none', true, null],
  ])(
    'returns no social links when showSocialLinks is %s',
    (_, showSocialLinks, socialLinks) => {
      const raw = mockRawHeroProfileModule({
        showSocialLinks,
        author: mockRawProfileAuthor({ socialLinks }),
      });

      const hero = toHeroProfileModule(raw);

      expect(hero.socialLinks).toEqual([]);
    },
  );

  it('maps an authored cta button', () => {
    const raw = mockRawHeroProfileModule({
      ctaButtons: [mockRawCtaButton()],
    });

    const hero = toHeroProfileModule(raw);

    expect(hero.ctaButtons).toEqual([mockCtaButtonView()]);
  });

  it('takes contentPosition and mediaOrder from the Split keys', () => {
    const raw = mockRawHeroProfileModule({
      variant: HERO_VARIANT.SPLIT,
      contentPositionSplit: CONTENT_ALIGNMENT.RIGHT,
      contentPositionBanner: CONTENT_ALIGNMENT.LEFT,
      mediaOrderSplit: MEDIA_ORDER.FIRST,
    });

    const hero = toHeroProfileModule(raw);

    expect(hero.contentPosition).toBe(CONTENT_ALIGNMENT.RIGHT);
    expect(hero.mediaOrder).toBe(MEDIA_ORDER.FIRST);
  });

  it('leaves mediaOrder undefined on Stacked, which authors no order of its own', () => {
    const raw = mockRawHeroProfileModule({
      variant: HERO_VARIANT.STACKED,
      mediaOrderSplit: MEDIA_ORDER.FIRST,
    });

    const hero = toHeroProfileModule(raw);

    expect(hero.mediaOrder).toBeUndefined();
  });

  it('maps a fully-authored layout object', () => {
    const layout = mockRawHeroLayout();
    const raw = mockRawHeroProfileModule({ layout });

    const hero = toHeroProfileModule(raw);

    expect(hero.layout).toEqual({ ...layout, containerWidth: undefined });
  });
});
