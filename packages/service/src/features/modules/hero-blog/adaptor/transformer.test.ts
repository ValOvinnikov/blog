import {
  BRAND_VARIANT,
  CONTENT_ALIGNMENT,
  CTA_ACTION_APPEARANCE,
  CTA_ACTION_VARIANT,
  HERO_IMAGE_SOURCE,
  HERO_VARIANT,
  LINK_TYPE,
  MEDIA_ORDER,
} from '@blog/config';
import {
  makeRawCtaButton,
  makeRawHeroBlogModule,
} from '@blog/service/testing/modules/fixtures';
import { makeRawPostCard } from '@blog/service/testing/pages/fixtures';
import {
  makeRawHeadingBlock,
  makeRawSanityImage,
} from '@blog/service/testing/shared/fixtures';

import { toHeroBlogModule } from './transformer';

describe(toHeroBlogModule, () => {
  it('maps brandVariant and variant straight through', () => {
    const raw = makeRawHeroBlogModule({
      brandVariant: BRAND_VARIANT.BRAND_PRIMARY,
      variant: HERO_VARIANT.BANNER,
    });

    const hero = toHeroBlogModule(raw);

    expect(hero.brandVariant).toBe(BRAND_VARIANT.BRAND_PRIMARY);
    expect(hero.variant).toBe(HERO_VARIANT.BANNER);
  });

  it('renders using the resolved pinned post', () => {
    const raw = makeRawHeroBlogModule({
      post: makeRawPostCard({
        _id: 'pinned-post',
        headingBlock: makeRawHeadingBlock('Pinned title'),
      }),
    });

    const hero = toHeroBlogModule(raw);

    if (!hero.hasPost) throw new Error('expected a resolved post');
    expect(hero.heading).toBe('Pinned title');
    expect(hero.ctaButtons[0]?.link.href).toBe('/blog/hello-world');
  });

  it('renders using the resolved newest-featured fallback post', () => {
    const raw = makeRawHeroBlogModule({
      post: makeRawPostCard({
        _id: 'newest-featured-post',
        headingBlock: makeRawHeadingBlock('Newest featured title'),
      }),
    });

    const hero = toHeroBlogModule(raw);

    if (!hero.hasPost) throw new Error('expected a resolved post');
    expect(hero.heading).toBe('Newest featured title');
    expect(hero.ctaButtons[0]?.link.href).toBe('/blog/hello-world');
  });

  it('reports hasPost false and has no derived copy, image or ctaButtons when no post resolves at all', () => {
    const raw = makeRawHeroBlogModule({ post: null });

    const hero = toHeroBlogModule(raw);

    expect(hero.hasPost).toBe(false);
    expect(hero.eyebrow).toBeUndefined();
    expect('heading' in hero).toBe(false);
    expect(hero.supportingText).toBeUndefined();
    expect(hero.sanityImage).toBeUndefined();
    expect(hero.ctaButtons).toEqual([]);
  });

  it('reports hasPost true and derives heading/supportingText from the resolved post', () => {
    const raw = makeRawHeroBlogModule({
      post: makeRawPostCard(),
      eyebrow: null,
    });

    const hero = toHeroBlogModule(raw);

    if (!hero.hasPost) throw new Error('expected a resolved post');
    expect(hero.eyebrow).toBe('Engineering');
    expect(hero.heading).toBe('Hello World');
    expect(hero.supportingText).toBe(
      'A sufficiently long excerpt for the card.',
    );
  });

  it('trusts an authored eyebrow over the resolved post topic', () => {
    const raw = makeRawHeroBlogModule({
      post: makeRawPostCard(),
      eyebrow: 'Field notes',
    });

    const hero = toHeroBlogModule(raw);

    expect(hero.eyebrow).toBe('Field notes');
  });

  it('uses the resolved post image when imageSource is POST', () => {
    const raw = makeRawHeroBlogModule({
      post: makeRawPostCard(),
      imageSource: HERO_IMAGE_SOURCE.POST,
      image: makeRawSanityImage('Custom alt'),
    });

    const hero = toHeroBlogModule(raw);

    expect(hero.sanityImage?.assetId).toBe('image-abc123-800x600-jpg');
    expect(hero.sanityImage?.alt).toBe('Alt text');
  });

  it('uses the custom module image when imageSource is CUSTOM', () => {
    const raw = makeRawHeroBlogModule({
      post: makeRawPostCard(),
      imageSource: HERO_IMAGE_SOURCE.CUSTOM,
      image: makeRawSanityImage('Custom alt'),
    });

    const hero = toHeroBlogModule(raw);

    expect(hero.sanityImage?.alt).toBe('Custom alt');
  });

  it('has no image at all when imageSource is NONE, even with a resolved post image', () => {
    const raw = makeRawHeroBlogModule({
      post: makeRawPostCard(),
      imageSource: HERO_IMAGE_SOURCE.NONE,
      image: makeRawSanityImage(),
    });

    const hero = toHeroBlogModule(raw);

    expect(hero.sanityImage).toBeUndefined();
  });

  it('falls back to "Read more" with a hidden suffix when primaryActionLabel is unset', () => {
    const raw = makeRawHeroBlogModule({
      post: makeRawPostCard(),
      primaryActionLabel: null,
    });

    const hero = toHeroBlogModule(raw);

    expect(hero.ctaButtons[0]).toEqual({
      variant: CTA_ACTION_VARIANT.PRIMARY,
      appearance: undefined,
      link: {
        label: 'Read more',
        href: '/blog/hello-world',
        target: undefined,
        platform: undefined,
        ariaLabel: undefined,
      },
      hiddenLabelSuffix: 'Hello World',
    });
  });

  it('trusts an authored primaryActionLabel and omits the hidden suffix', () => {
    const raw = makeRawHeroBlogModule({
      post: makeRawPostCard(),
      primaryActionLabel: 'Discover the story',
    });

    const hero = toHeroBlogModule(raw);

    expect(hero.ctaButtons[0]).toMatchObject({
      link: { label: 'Discover the story' },
      hiddenLabelSuffix: undefined,
    });
  });

  it.each([CTA_ACTION_APPEARANCE.CONTAINED, CTA_ACTION_APPEARANCE.INLINE])(
    'carries the authored primaryActionAppearance %s onto the primary button',
    (appearance) => {
      const raw = makeRawHeroBlogModule({
        post: makeRawPostCard(),
        primaryActionAppearance: appearance,
      });

      const hero = toHeroBlogModule(raw);

      expect(hero.ctaButtons[0]?.appearance).toBe(appearance);
    },
  );

  it('leaves the primary button appearance undefined when unset (no faked default)', () => {
    const raw = makeRawHeroBlogModule({
      post: makeRawPostCard(),
      primaryActionAppearance: null,
    });

    const hero = toHeroBlogModule(raw);

    expect(hero.ctaButtons[0]?.appearance).toBeUndefined();
  });

  it('has no ctaButtons when there is no post and no authored secondary', () => {
    const raw = makeRawHeroBlogModule({ post: null, ctaButtons: null });

    const hero = toHeroBlogModule(raw);

    expect(hero.ctaButtons).toEqual([]);
  });

  it('places the derived primary before the authored secondary', () => {
    const raw = makeRawHeroBlogModule({
      post: makeRawPostCard(),
      ctaButtons: [
        makeRawCtaButton({
          variant: CTA_ACTION_VARIANT.SECONDARY,
          appearance: null,
          link: {
            label: 'View all posts',
            linkType: LINK_TYPE.INTERNAL,
            internalReference: { _type: 'page_postIndex', slug: null },
            url: null,
            openInNewTab: null,
          },
        }),
      ],
    });

    const hero = toHeroBlogModule(raw);

    expect(hero.ctaButtons).toHaveLength(2);
    expect(hero.ctaButtons[0]).toMatchObject({
      variant: CTA_ACTION_VARIANT.PRIMARY,
    });
    expect(hero.ctaButtons[1]).toEqual({
      variant: CTA_ACTION_VARIANT.SECONDARY,
      appearance: undefined,
      link: {
        label: 'View all posts',
        href: '/blog',
        target: undefined,
        platform: undefined,
        ariaLabel: undefined,
      },
    });
  });

  it('drops an authored secondary whose link cannot resolve to an href', () => {
    const raw = makeRawHeroBlogModule({
      post: null,
      ctaButtons: [
        makeRawCtaButton({
          link: {
            label: 'Broken',
            linkType: LINK_TYPE.INTERNAL,
            internalReference: null,
            url: null,
            openInNewTab: null,
          },
        }),
      ],
    });

    const hero = toHeroBlogModule(raw);

    expect(hero.ctaButtons).toEqual([]);
  });

  it('takes contentPosition from contentPositionSplit on Split, ignoring contentPositionBanner', () => {
    const raw = makeRawHeroBlogModule({
      variant: HERO_VARIANT.SPLIT,
      contentPositionSplit: CONTENT_ALIGNMENT.RIGHT,
      contentPositionBanner: CONTENT_ALIGNMENT.LEFT,
    });

    const hero = toHeroBlogModule(raw);

    expect(hero.contentPosition).toBe(CONTENT_ALIGNMENT.RIGHT);
  });

  it('takes contentPosition from contentPositionBanner on Banner, ignoring contentPositionSplit', () => {
    const raw = makeRawHeroBlogModule({
      variant: HERO_VARIANT.BANNER,
      contentPositionSplit: CONTENT_ALIGNMENT.RIGHT,
      contentPositionBanner: CONTENT_ALIGNMENT.CENTER,
    });

    const hero = toHeroBlogModule(raw);

    expect(hero.contentPosition).toBe(CONTENT_ALIGNMENT.CENTER);
  });

  it('leaves contentPosition undefined on Stacked regardless of stored position keys', () => {
    const raw = makeRawHeroBlogModule({
      variant: HERO_VARIANT.STACKED,
      contentPositionSplit: CONTENT_ALIGNMENT.RIGHT,
      contentPositionBanner: CONTENT_ALIGNMENT.CENTER,
    });

    const hero = toHeroBlogModule(raw);

    expect(hero.contentPosition).toBeUndefined();
  });

  it('leaves contentAlignment undefined when unset', () => {
    const raw = makeRawHeroBlogModule({ contentAlignment: null });

    const hero = toHeroBlogModule(raw);

    expect(hero.contentAlignment).toBeUndefined();
  });

  it('maps contentAlignment when authored, independent of variant', () => {
    const raw = makeRawHeroBlogModule({
      contentAlignment: CONTENT_ALIGNMENT.CENTER,
    });

    const hero = toHeroBlogModule(raw);

    expect(hero.contentAlignment).toBe(CONTENT_ALIGNMENT.CENTER);
  });

  it('takes mediaOrder from mediaOrderSplit on Split, ignoring mediaOrderStacked', () => {
    const raw = makeRawHeroBlogModule({
      variant: HERO_VARIANT.SPLIT,
      mediaOrderSplit: MEDIA_ORDER.FIRST,
      mediaOrderStacked: MEDIA_ORDER.LAST,
    });

    const hero = toHeroBlogModule(raw);

    expect(hero.mediaOrder).toBe(MEDIA_ORDER.FIRST);
  });

  it('takes mediaOrder from mediaOrderStacked on Stacked, ignoring mediaOrderSplit', () => {
    const raw = makeRawHeroBlogModule({
      variant: HERO_VARIANT.STACKED,
      mediaOrderSplit: MEDIA_ORDER.FIRST,
      mediaOrderStacked: MEDIA_ORDER.LAST,
    });

    const hero = toHeroBlogModule(raw);

    expect(hero.mediaOrder).toBe(MEDIA_ORDER.LAST);
  });

  it('leaves mediaOrder undefined on Banner regardless of stored order keys', () => {
    const raw = makeRawHeroBlogModule({
      variant: HERO_VARIANT.BANNER,
      mediaOrderSplit: MEDIA_ORDER.FIRST,
      mediaOrderStacked: MEDIA_ORDER.FIRST,
    });

    const hero = toHeroBlogModule(raw);

    expect(hero.mediaOrder).toBeUndefined();
  });

  it('leaves layout undefined when unset (no faked default)', () => {
    const raw = makeRawHeroBlogModule({ layout: null });

    const hero = toHeroBlogModule(raw);

    expect(hero.layout).toBeUndefined();
  });

  it('maps a fully-authored layout object', () => {
    const raw = makeRawHeroBlogModule({
      layout: {
        spacingTop: 'LG',
        spacingBottom: 'SM',
        dividerTop: true,
        dividerBottom: false,
      },
    });

    const hero = toHeroBlogModule(raw);

    expect(hero.layout).toEqual({
      spacingTop: 'LG',
      spacingBottom: 'SM',
      containerWidth: undefined,
      dividerTop: true,
      dividerBottom: false,
    });
  });
});
