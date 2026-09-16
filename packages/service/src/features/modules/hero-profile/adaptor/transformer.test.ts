import {
  BRAND_VARIANT,
  CONTENT_ALIGNMENT,
  CTA_ACTION_APPEARANCE,
  CTA_ACTION_VARIANT,
  HERO_VARIANT,
  LINK_TYPE,
  MEDIA_ORDER,
  PROFILE_IMAGE_SOURCE,
} from '@blog/config';
import {
  makeRawCtaButton,
  makeRawHeroProfileModule,
} from '@blog/service/testing/modules/fixtures';
import {
  makeRawHeadingBlock,
  makeRawSanityImage,
  makeRawSocialProfile,
} from '@blog/service/testing/shared/fixtures';

import { toHeroProfileModule } from './transformer';

describe(toHeroProfileModule, () => {
  it('maps brandVariant, variant and headingBlock straight through', () => {
    const raw = makeRawHeroProfileModule({
      brandVariant: BRAND_VARIANT.BRAND_PRIMARY,
      variant: HERO_VARIANT.BANNER,
      headingBlock: makeRawHeadingBlock('Meet the author'),
    });

    const hero = toHeroProfileModule(raw);

    expect(hero.brandVariant).toBe(BRAND_VARIANT.BRAND_PRIMARY);
    expect(hero.variant).toBe(HERO_VARIANT.BANNER);
    expect(hero.headingBlock).toEqual({
      heading: 'Meet the author',
      supportingText: undefined,
    });
  });

  it('leaves eyebrow undefined when unset', () => {
    const raw = makeRawHeroProfileModule({ eyebrow: null });

    const hero = toHeroProfileModule(raw);

    expect(hero.eyebrow).toBeUndefined();
  });

  it('maps an authored eyebrow untouched', () => {
    const raw = makeRawHeroProfileModule({ eyebrow: 'Field notes' });

    const hero = toHeroProfileModule(raw);

    expect(hero.eyebrow).toBe('Field notes');
  });

  it('uses the custom image when Source is Custom', () => {
    const raw = makeRawHeroProfileModule({
      imageSource: PROFILE_IMAGE_SOURCE.CUSTOM,
      image: makeRawSanityImage('Custom alt'),
      author: { image: makeRawSanityImage('Author alt'), socialLinks: null },
    });

    const hero = toHeroProfileModule(raw);

    expect(hero.sanityImage?.alt).toBe('Custom alt');
  });

  it('falls back to no image when Source is Custom but none was set', () => {
    const raw = makeRawHeroProfileModule({
      imageSource: PROFILE_IMAGE_SOURCE.CUSTOM,
      image: null,
    });

    const hero = toHeroProfileModule(raw);

    expect(hero.sanityImage).toBeUndefined();
  });

  it('uses the author photo when Source is Author', () => {
    const raw = makeRawHeroProfileModule({
      imageSource: PROFILE_IMAGE_SOURCE.AUTHOR,
      author: { image: makeRawSanityImage('Author alt'), socialLinks: null },
    });

    const hero = toHeroProfileModule(raw);

    expect(hero.sanityImage?.alt).toBe('Author alt');
  });

  it('leaves the image undefined when Source is Author but the author has none', () => {
    const raw = makeRawHeroProfileModule({
      imageSource: PROFILE_IMAGE_SOURCE.AUTHOR,
      author: { image: null, socialLinks: null },
    });

    const hero = toHeroProfileModule(raw);

    expect(hero.sanityImage).toBeUndefined();
  });

  it('leaves the image undefined when Source is None', () => {
    const raw = makeRawHeroProfileModule({
      imageSource: PROFILE_IMAGE_SOURCE.NONE,
      image: makeRawSanityImage('Custom alt'),
      author: { image: makeRawSanityImage('Author alt'), socialLinks: null },
    });

    const hero = toHeroProfileModule(raw);

    expect(hero.sanityImage).toBeUndefined();
  });

  it('maps the author social links when the toggle is on', () => {
    const raw = makeRawHeroProfileModule({
      showSocialLinks: true,
      author: {
        image: null,
        socialLinks: [makeRawSocialProfile()],
      },
    });

    const hero = toHeroProfileModule(raw);

    expect(hero.socialLinks).toEqual([
      {
        platform: 'GITHUB',
        link: {
          label: 'Learn more',
          href: 'https://example.com',
          target: undefined,
          platform: undefined,
          ariaLabel: undefined,
        },
      },
    ]);
  });

  it('returns no social links when the toggle is off, even when the author has some', () => {
    const raw = makeRawHeroProfileModule({
      showSocialLinks: false,
      author: {
        image: null,
        socialLinks: [makeRawSocialProfile()],
      },
    });

    const hero = toHeroProfileModule(raw);

    expect(hero.socialLinks).toEqual([]);
  });

  it('returns no social links when the author has none', () => {
    const raw = makeRawHeroProfileModule({
      showSocialLinks: true,
      author: { image: null, socialLinks: null },
    });

    const hero = toHeroProfileModule(raw);

    expect(hero.socialLinks).toEqual([]);
  });

  it('drops a social link whose link cannot resolve to an href', () => {
    const raw = makeRawHeroProfileModule({
      showSocialLinks: true,
      author: {
        image: null,
        socialLinks: [
          makeRawSocialProfile({
            link: {
              label: 'Broken',
              linkType: LINK_TYPE.INTERNAL,
              internalReference: null,
              url: null,
              openInNewTab: null,
            },
          }),
        ],
      },
    });

    const hero = toHeroProfileModule(raw);

    expect(hero.socialLinks).toEqual([]);
  });

  it('returns an empty array for an absent ctaButtons field', () => {
    const raw = makeRawHeroProfileModule({ ctaButtons: null });

    const hero = toHeroProfileModule(raw);

    expect(hero.ctaButtons).toEqual([]);
  });

  it('maps a single PRIMARY button', () => {
    const raw = makeRawHeroProfileModule({
      ctaButtons: [makeRawCtaButton()],
    });

    const hero = toHeroProfileModule(raw);

    expect(hero.ctaButtons).toEqual([
      {
        variant: CTA_ACTION_VARIANT.PRIMARY,
        appearance: CTA_ACTION_APPEARANCE.CONTAINED,
        link: {
          label: 'Subscribe',
          href: '/newsletter',
          target: undefined,
          platform: undefined,
          ariaLabel: undefined,
        },
      },
    ]);
  });

  it('drops a cta button whose link cannot resolve to an href', () => {
    const raw = makeRawHeroProfileModule({
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

    const hero = toHeroProfileModule(raw);

    expect(hero.ctaButtons).toEqual([]);
  });

  it('takes contentPosition from contentPositionSplit on Split', () => {
    const raw = makeRawHeroProfileModule({
      variant: HERO_VARIANT.SPLIT,
      contentPositionSplit: CONTENT_ALIGNMENT.RIGHT,
      contentPositionBanner: CONTENT_ALIGNMENT.LEFT,
    });

    const hero = toHeroProfileModule(raw);

    expect(hero.contentPosition).toBe(CONTENT_ALIGNMENT.RIGHT);
  });

  it('takes contentPosition from contentPositionBanner on Banner', () => {
    const raw = makeRawHeroProfileModule({
      variant: HERO_VARIANT.BANNER,
      contentPositionSplit: CONTENT_ALIGNMENT.RIGHT,
      contentPositionBanner: CONTENT_ALIGNMENT.CENTER,
    });

    const hero = toHeroProfileModule(raw);

    expect(hero.contentPosition).toBe(CONTENT_ALIGNMENT.CENTER);
  });

  it('leaves contentPosition undefined on Stacked', () => {
    const raw = makeRawHeroProfileModule({
      variant: HERO_VARIANT.STACKED,
      contentPositionSplit: CONTENT_ALIGNMENT.RIGHT,
      contentPositionBanner: CONTENT_ALIGNMENT.CENTER,
    });

    const hero = toHeroProfileModule(raw);

    expect(hero.contentPosition).toBeUndefined();
  });

  it('leaves contentAlignment undefined when unset', () => {
    const raw = makeRawHeroProfileModule({ contentAlignment: null });

    const hero = toHeroProfileModule(raw);

    expect(hero.contentAlignment).toBeUndefined();
  });

  it('takes mediaOrder from mediaOrderSplit on Split', () => {
    const raw = makeRawHeroProfileModule({
      variant: HERO_VARIANT.SPLIT,
      mediaOrderSplit: MEDIA_ORDER.FIRST,
    });

    const hero = toHeroProfileModule(raw);

    expect(hero.mediaOrder).toBe(MEDIA_ORDER.FIRST);
  });

  it('leaves mediaOrder undefined on Stacked, since the schema has no mediaOrderStacked field for this hero', () => {
    const raw = makeRawHeroProfileModule({
      variant: HERO_VARIANT.STACKED,
      mediaOrderSplit: MEDIA_ORDER.FIRST,
    });

    const hero = toHeroProfileModule(raw);

    expect(hero.mediaOrder).toBeUndefined();
  });

  it('leaves mediaOrder undefined on Banner', () => {
    const raw = makeRawHeroProfileModule({
      variant: HERO_VARIANT.BANNER,
      mediaOrderSplit: MEDIA_ORDER.FIRST,
    });

    const hero = toHeroProfileModule(raw);

    expect(hero.mediaOrder).toBeUndefined();
  });

  it('leaves layout undefined when unset', () => {
    const raw = makeRawHeroProfileModule({ layout: null });

    const hero = toHeroProfileModule(raw);

    expect(hero.layout).toBeUndefined();
  });

  it('maps a fully-authored layout object', () => {
    const raw = makeRawHeroProfileModule({
      layout: {
        spacingTop: 'LG',
        spacingBottom: 'SM',
        dividerTop: true,
        dividerBottom: false,
      },
    });

    const hero = toHeroProfileModule(raw);

    expect(hero.layout).toEqual({
      spacingTop: 'LG',
      spacingBottom: 'SM',
      containerWidth: undefined,
      dividerTop: true,
      dividerBottom: false,
    });
  });
});
