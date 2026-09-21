import {
  BRAND_VARIANT,
  CONTENT_ALIGNMENT,
  CTA_ACTION_APPEARANCE,
  CTA_ACTION_VARIANT,
  HERO_VARIANT,
  LINK_TYPE,
  MEDIA_ORDER,
  SOCIAL_PLATFORMS,
} from '@blog/config';
import {
  makeRawCtaButton,
  makeRawHeroProfileModule,
} from '@blog/service/testing/modules/fixtures';
import {
  makeRawExternalLinkDocument,
  makeRawHeadingBlock,
  makeRawSanityImage,
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

  it("maps avatarName from the author's name, straight through", () => {
    const raw = makeRawHeroProfileModule({
      author: {
        name: 'Alex Chen',
        image: null,
        socialLinks: null,
      },
    });

    const hero = toHeroProfileModule(raw);

    expect(hero.avatarName).toBe('Alex Chen');
  });

  describe('image precedence', () => {
    it("uses the hero's own image when set, ignoring the author photo", () => {
      const raw = makeRawHeroProfileModule({
        image: makeRawSanityImage('Custom alt'),
        author: {
          name: 'Jamie Rivera',
          image: makeRawSanityImage('Author photo'),
          socialLinks: null,
        },
      });

      const hero = toHeroProfileModule(raw);

      expect(hero.sanityImage?.alt).toBe('Custom alt');
    });

    it("falls back to the author's photo when the hero has no image of its own", () => {
      const raw = makeRawHeroProfileModule({
        image: null,
        author: {
          name: 'Jamie Rivera',
          image: makeRawSanityImage('Author photo'),
          socialLinks: null,
        },
      });

      const hero = toHeroProfileModule(raw);

      expect(hero.sanityImage?.alt).toBe('Author photo');
    });

    it('leaves sanityImage undefined when neither the hero nor the author has a photo (a supported state)', () => {
      const raw = makeRawHeroProfileModule({
        image: null,
        author: { name: 'Jamie Rivera', image: null, socialLinks: null },
      });

      const hero = toHeroProfileModule(raw);

      expect(hero.sanityImage).toBeUndefined();
    });

    it('on Banner, leaves sanityImage undefined when only the author has a photo', () => {
      const raw = makeRawHeroProfileModule({
        variant: HERO_VARIANT.BANNER,
        image: null,
        author: {
          name: 'Jamie Rivera',
          image: makeRawSanityImage('Author photo'),
          socialLinks: null,
        },
      });

      const hero = toHeroProfileModule(raw);

      expect(hero.sanityImage).toBeUndefined();
    });

    it('on Banner, keeps the custom image', () => {
      const raw = makeRawHeroProfileModule({
        variant: HERO_VARIANT.BANNER,
        image: makeRawSanityImage('Custom alt'),
        author: {
          name: 'Jamie Rivera',
          image: makeRawSanityImage('Author photo'),
          socialLinks: null,
        },
      });

      const hero = toHeroProfileModule(raw);

      expect(hero.sanityImage?.alt).toBe('Custom alt');
    });
  });

  describe('social links', () => {
    it('maps the author social links when showSocialLinks is on', () => {
      const raw = makeRawHeroProfileModule({
        showSocialLinks: true,
        author: {
          name: 'Jamie Rivera',
          image: null,
          socialLinks: [
            {
              platform: SOCIAL_PLATFORMS.GITHUB,
              link: makeRawExternalLinkDocument({
                label: 'GitHub',
                url: 'https://github.com/val',
              }),
            },
          ],
        },
      });

      const hero = toHeroProfileModule(raw);

      expect(hero.socialLinks).toEqual([
        {
          platform: SOCIAL_PLATFORMS.GITHUB,
          link: {
            label: 'GitHub',
            href: 'https://github.com/val',
            target: undefined,
            platform: undefined,
            ariaLabel: undefined,
          },
        },
      ]);
    });

    it('returns an empty array when showSocialLinks is off, even if the author has links', () => {
      const raw = makeRawHeroProfileModule({
        showSocialLinks: false,
        author: {
          name: 'Jamie Rivera',
          image: null,
          socialLinks: [
            {
              platform: SOCIAL_PLATFORMS.GITHUB,
              link: makeRawExternalLinkDocument(),
            },
          ],
        },
      });

      const hero = toHeroProfileModule(raw);

      expect(hero.socialLinks).toEqual([]);
    });

    it('returns an empty array when showSocialLinks is on and the author has none (a supported state)', () => {
      const raw = makeRawHeroProfileModule({
        showSocialLinks: true,
        author: { name: 'Jamie Rivera', image: null, socialLinks: null },
      });

      const hero = toHeroProfileModule(raw);

      expect(hero.socialLinks).toEqual([]);
    });

    it('drops a social link whose href cannot resolve', () => {
      const raw = makeRawHeroProfileModule({
        showSocialLinks: true,
        author: {
          name: 'Jamie Rivera',
          image: null,
          socialLinks: [
            {
              platform: SOCIAL_PLATFORMS.GITHUB,
              link: {
                label: 'Broken',
                linkType: LINK_TYPE.INTERNAL,
                internalReference: null,
                url: null,
                openInNewTab: null,
              },
            },
          ],
        },
      });

      const hero = toHeroProfileModule(raw);

      expect(hero.socialLinks).toEqual([]);
    });
  });

  it('returns an empty array for an absent ctaButtons field', () => {
    const raw = makeRawHeroProfileModule({ ctaButtons: null });

    const hero = toHeroProfileModule(raw);

    expect(hero.ctaButtons).toEqual([]);
  });

  it('maps an authored cta button', () => {
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

  it('takes contentPosition from contentPositionSplit on Split, ignoring contentPositionBanner', () => {
    const raw = makeRawHeroProfileModule({
      variant: HERO_VARIANT.SPLIT,
      contentPositionSplit: CONTENT_ALIGNMENT.RIGHT,
      contentPositionBanner: CONTENT_ALIGNMENT.LEFT,
    });

    const hero = toHeroProfileModule(raw);

    expect(hero.contentPosition).toBe(CONTENT_ALIGNMENT.RIGHT);
  });

  it('takes contentPosition from contentPositionBanner on Banner, ignoring contentPositionSplit', () => {
    const raw = makeRawHeroProfileModule({
      variant: HERO_VARIANT.BANNER,
      contentPositionSplit: CONTENT_ALIGNMENT.RIGHT,
      contentPositionBanner: CONTENT_ALIGNMENT.CENTER,
    });

    const hero = toHeroProfileModule(raw);

    expect(hero.contentPosition).toBe(CONTENT_ALIGNMENT.CENTER);
  });

  it('leaves contentPosition undefined on Stacked regardless of stored position keys', () => {
    const raw = makeRawHeroProfileModule({
      variant: HERO_VARIANT.STACKED,
      contentPositionSplit: CONTENT_ALIGNMENT.RIGHT,
      contentPositionBanner: CONTENT_ALIGNMENT.CENTER,
    });

    const hero = toHeroProfileModule(raw);

    expect(hero.contentPosition).toBeUndefined();
  });

  it('takes mediaOrder from mediaOrderSplit on Split', () => {
    const raw = makeRawHeroProfileModule({
      variant: HERO_VARIANT.SPLIT,
      mediaOrderSplit: MEDIA_ORDER.FIRST,
    });

    const hero = toHeroProfileModule(raw);

    expect(hero.mediaOrder).toBe(MEDIA_ORDER.FIRST);
  });

  it('leaves mediaOrder undefined on Stacked — heroProfile authors no mediaOrderStacked field', () => {
    const raw = makeRawHeroProfileModule({
      variant: HERO_VARIANT.STACKED,
      mediaOrderSplit: MEDIA_ORDER.FIRST,
    });

    const hero = toHeroProfileModule(raw);

    expect(hero.mediaOrder).toBeUndefined();
  });

  it('leaves layout undefined when unset (no faked default)', () => {
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
