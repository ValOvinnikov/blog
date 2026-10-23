import {
  BRAND_VARIANT,
  CONTENT_ALIGNMENT,
  CTA_ACTION_APPEARANCE,
  CTA_ACTION_VARIANT,
  HERO_VARIANT,
  LINK_TYPE,
  MEDIA_ORDER,
} from '@blog/config';
import { MOCK_TOPIC_TITLE } from '@blog/service/testing/entities/fixtures';
import {
  MOCK_HERO_EYEBROW,
  MOCK_HERO_IMAGE_ALT,
  mockRawCtaButton,
  mockRawHeroBlogModule,
} from '@blog/service/testing/modules/fixtures';
import { mockRawPostCard } from '@blog/service/testing/pages/fixtures';
import {
  MOCK_POST_EXCERPT,
  MOCK_POST_HREF,
  MOCK_POST_TITLE,
  mockLinkView,
  mockRawHeroLayout,
  mockRawInternalLinkDocument,
  mockRawSanityImage,
  mockSanityImageView,
} from '@blog/service/testing/shared/fixtures';

import { toHeroBlogModule, type TRawHeroBlogModule } from './transformer';

const SECONDARY_LABEL = 'View all posts';
const AUTHORED_ACTION_LABEL = 'Discover the story';

function rawWithPost(overrides: Partial<TRawHeroBlogModule> = {}) {
  return mockRawHeroBlogModule({ post: mockRawPostCard(), ...overrides });
}

describe(toHeroBlogModule, () => {
  it('maps brandVariant and variant straight through', () => {
    const raw = mockRawHeroBlogModule({
      brandVariant: BRAND_VARIANT.BRAND_PRIMARY,
      variant: HERO_VARIANT.BANNER,
    });

    const hero = toHeroBlogModule(raw);

    expect(hero.brandVariant).toBe(BRAND_VARIANT.BRAND_PRIMARY);
    expect(hero.variant).toBe(HERO_VARIANT.BANNER);
  });

  it('reports no post, and derives no copy, image or buttons, without one', () => {
    const raw = mockRawHeroBlogModule({ post: null });

    const hero = toHeroBlogModule(raw);

    expect(hero.hasPost).toBe(false);
    expect(hero.eyebrow).toBeUndefined();
    expect('heading' in hero).toBe(false);
    expect(hero.supportingText).toBeUndefined();
    expect(hero.sanityImage).toBeUndefined();
    expect(hero.ctaButtons).toEqual([]);
  });

  it.each([
    [true, true],
    [false, false],
  ])(
    'with no resolved post and hasPinnedPost %s, marks isPostUntranslated %s',
    (hasPinnedPost, expected) => {
      const raw = mockRawHeroBlogModule({ post: null, hasPinnedPost });

      const hero = toHeroBlogModule(raw);

      if (hero.hasPost) throw new Error('expected no resolved post');
      expect(hero.isPostUntranslated).toBe(expected);
    },
  );

  it('reports the post and derives the heading and supporting text from it', () => {
    const raw = rawWithPost({
      eyebrow: null,
    });

    const hero = toHeroBlogModule(raw);

    if (!hero.hasPost) throw new Error('expected a resolved post');
    expect(hero.eyebrow).toBe(MOCK_TOPIC_TITLE);
    expect(hero.heading).toBe(MOCK_POST_TITLE);
    expect(hero.supportingText).toBe(MOCK_POST_EXCERPT);
  });

  it('trusts an authored eyebrow over the resolved post topic', () => {
    const raw = rawWithPost({
      eyebrow: MOCK_HERO_EYEBROW,
    });

    const hero = toHeroBlogModule(raw);

    expect(hero.eyebrow).toBe(MOCK_HERO_EYEBROW);
  });

  it('falls back to the resolved post image when no custom image is set', () => {
    const raw = rawWithPost({
      image: null,
    });

    const hero = toHeroBlogModule(raw);

    expect(hero.sanityImage).toEqual(mockSanityImageView());
  });

  it('prefers the custom module image over the resolved post image', () => {
    const raw = rawWithPost({
      image: mockRawSanityImage(MOCK_HERO_IMAGE_ALT),
    });

    const hero = toHeroBlogModule(raw);

    expect(hero.sanityImage?.alt).toBe(MOCK_HERO_IMAGE_ALT);
  });

  it('builds the primary button from the authored label, linking to the resolved post', () => {
    const raw = rawWithPost({
      primaryActionLabel: AUTHORED_ACTION_LABEL,
      primaryActionAppearance: CTA_ACTION_APPEARANCE.CONTAINED,
    });

    const hero = toHeroBlogModule(raw);

    expect(hero.ctaButtons[0]).toEqual({
      variant: CTA_ACTION_VARIANT.PRIMARY,
      appearance: CTA_ACTION_APPEARANCE.CONTAINED,
      link: mockLinkView({
        label: AUTHORED_ACTION_LABEL,
        href: MOCK_POST_HREF,
      }),
    });
  });

  it.each([CTA_ACTION_APPEARANCE.CONTAINED, CTA_ACTION_APPEARANCE.INLINE])(
    'carries the authored primaryActionAppearance %s onto the primary button',
    (appearance) => {
      const raw = rawWithPost({
        primaryActionAppearance: appearance,
      });

      const hero = toHeroBlogModule(raw);

      expect(hero.ctaButtons[0]?.appearance).toBe(appearance);
    },
  );

  it('places the derived primary before the authored secondary', () => {
    const raw = rawWithPost({
      secondaryAction: mockRawCtaButton({
        variant: CTA_ACTION_VARIANT.SECONDARY,
        appearance: null,
        link: {
          label: SECONDARY_LABEL,
          linkType: LINK_TYPE.INTERNAL,
          internalReference: { _type: 'page_postIndex', slug: null },
          url: null,
          openInNewTab: null,
        },
      }),
    });

    const hero = toHeroBlogModule(raw);

    expect(hero.ctaButtons).toHaveLength(2);
    expect(hero.ctaButtons[0]).toMatchObject({
      variant: CTA_ACTION_VARIANT.PRIMARY,
    });
    expect(hero.ctaButtons[1]).toEqual({
      variant: CTA_ACTION_VARIANT.SECONDARY,
      appearance: undefined,
      link: mockLinkView({ label: SECONDARY_LABEL, href: '/blog' }),
    });
  });

  it.each([
    ['cannot resolve to an href', mockRawInternalLinkDocument()],
    ['was never set', null],
  ])('drops an authored secondary whose link %s', (_, link) => {
    const raw = mockRawHeroBlogModule({
      post: null,
      secondaryAction: {
        variant: CTA_ACTION_VARIANT.SECONDARY,
        appearance: CTA_ACTION_APPEARANCE.CONTAINED,
        link,
      },
    });

    const hero = toHeroBlogModule(raw);

    expect(hero.ctaButtons).toEqual([]);
  });

  it('takes contentPosition and mediaOrder from the Split keys', () => {
    const raw = mockRawHeroBlogModule({
      variant: HERO_VARIANT.SPLIT,
      contentPositionSplit: CONTENT_ALIGNMENT.RIGHT,
      contentPositionBanner: CONTENT_ALIGNMENT.LEFT,
      mediaOrderSplit: MEDIA_ORDER.FIRST,
      mediaOrderStacked: MEDIA_ORDER.LAST,
    });

    const hero = toHeroBlogModule(raw);

    expect(hero.contentPosition).toBe(CONTENT_ALIGNMENT.RIGHT);
    expect(hero.mediaOrder).toBe(MEDIA_ORDER.FIRST);
  });

  it.each([
    [null, undefined],
    [CONTENT_ALIGNMENT.CENTER, CONTENT_ALIGNMENT.CENTER],
  ])('maps contentAlignment %s to %s', (contentAlignment, expected) => {
    const raw = mockRawHeroBlogModule({ contentAlignment });

    const hero = toHeroBlogModule(raw);

    expect(hero.contentAlignment).toBe(expected);
  });

  it('maps a fully-authored layout object', () => {
    const layout = mockRawHeroLayout();
    const raw = mockRawHeroBlogModule({ layout });

    const hero = toHeroBlogModule(raw);

    expect(hero.layout).toEqual({ ...layout, containerWidth: undefined });
  });
});
