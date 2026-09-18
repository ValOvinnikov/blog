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

  describe('imageSource', () => {
    it('maps the author photo when imageSource is AUTHOR and the author has one', () => {
      const raw = makeRawHeroProfileModule({
        imageSource: PROFILE_IMAGE_SOURCE.AUTHOR,
        image: null,
        author: {
          image: makeRawSanityImage('Author photo'),
          socialLinks: null,
        },
      });

      const hero = toHeroProfileModule(raw);

      expect(hero.sanityImage?.alt).toBe('Author photo');
    });

    it('leaves sanityImage undefined when imageSource is AUTHOR and the author has no photo (a supported state)', () => {
      const raw = makeRawHeroProfileModule({
        imageSource: PROFILE_IMAGE_SOURCE.AUTHOR,
        author: { image: null, socialLinks: null },
      });

      const hero = toHeroProfileModule(raw);

      expect(hero.sanityImage).toBeUndefined();
    });

    it('maps the authored custom image when imageSource is CUSTOM, ignoring the author photo', () => {
      const raw = makeRawHeroProfileModule({
        imageSource: PROFILE_IMAGE_SOURCE.CUSTOM,
        image: makeRawSanityImage('Custom alt'),
        author: {
          image: makeRawSanityImage('Author photo'),
          socialLinks: null,
        },
      });

      const hero = toHeroProfileModule(raw);

      expect(hero.sanityImage?.alt).toBe('Custom alt');
    });

    it('leaves sanityImage undefined when imageSource is NONE, ignoring both image fields', () => {
      const raw = makeRawHeroProfileModule({
        imageSource: PROFILE_IMAGE_SOURCE.NONE,
        image: makeRawSanityImage('Custom alt'),
        author: {
          image: makeRawSanityImage('Author photo'),
          socialLinks: null,
        },
      });

      const hero = toHeroProfileModule(raw);

      expect(hero.sanityImage).toBeUndefined();
    });
  });

  describe('social links', () => {
    it('maps the author social links when showSocialLinks is on', () => {
      const raw = makeRawHeroProfileModule({
        showSocialLinks: true,
        author: {
          image: null,
          socialLinks: [
            {
              platform: 'GITHUB',
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
          platform: 'GITHUB',
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
          image: null,
          socialLinks: [
            {
              platform: 'GITHUB',
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
        author: { image: null, socialLinks: null },
      });

      const hero = toHeroProfileModule(raw);

      expect(hero.socialLinks).toEqual([]);
    });

    it('drops a social link whose href cannot resolve', () => {
      const raw = makeRawHeroProfileModule({
        showSocialLinks: true,
        author: {
          image: null,
          socialLinks: [
            {
              platform: 'GITHUB',
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
