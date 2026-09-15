import {
  BRAND_VARIANT,
  CONTENT_ALIGNMENT,
  CTA_ACTION_APPEARANCE,
  CTA_ACTION_VARIANT,
  HERO_VARIANT,
  LINK_TYPE,
  MEDIA_ORDER,
} from '@blog/config';
import {
  makeRawCtaButton,
  makeRawHeroStatementModule,
} from '@blog/service/testing/modules/fixtures';
import {
  makeRawHeadingBlock,
  makeRawSanityImage,
} from '@blog/service/testing/shared/fixtures';

import { toHeroStatementModule } from './transformer';

describe(toHeroStatementModule, () => {
  it('maps brandVariant, variant and headingBlock straight through', () => {
    const raw = makeRawHeroStatementModule({
      brandVariant: BRAND_VARIANT.BRAND_PRIMARY,
      variant: HERO_VARIANT.BANNER,
      headingBlock: makeRawHeadingBlock('Ship confidently'),
    });

    const hero = toHeroStatementModule(raw);

    expect(hero.brandVariant).toBe(BRAND_VARIANT.BRAND_PRIMARY);
    expect(hero.variant).toBe(HERO_VARIANT.BANNER);
    expect(hero.headingBlock).toEqual({
      heading: 'Ship confidently',
      supportingText: undefined,
    });
  });

  it('leaves eyebrow and headingBlock.supportingText undefined when unset', () => {
    const raw = makeRawHeroStatementModule({
      eyebrow: null,
      headingBlock: makeRawHeadingBlock('Statement heading', {
        supportingText: null,
      }),
    });

    const hero = toHeroStatementModule(raw);

    expect(hero.eyebrow).toBeUndefined();
    expect(hero.headingBlock.supportingText).toBeUndefined();
  });

  it('maps an authored eyebrow and headingBlock.supportingText', () => {
    const raw = makeRawHeroStatementModule({
      eyebrow: 'Field notes',
      headingBlock: makeRawHeadingBlock('Statement heading', {
        supportingText: 'Supporting copy.',
      }),
    });

    const hero = toHeroStatementModule(raw);

    expect(hero.eyebrow).toBe('Field notes');
    expect(hero.headingBlock.supportingText).toBe('Supporting copy.');
  });

  it('leaves sanityImage undefined when unset', () => {
    const raw = makeRawHeroStatementModule({ image: null });

    const hero = toHeroStatementModule(raw);

    expect(hero.sanityImage).toBeUndefined();
  });

  it('maps an authored image', () => {
    const raw = makeRawHeroStatementModule({
      image: makeRawSanityImage('Custom alt'),
    });

    const hero = toHeroStatementModule(raw);

    expect(hero.sanityImage?.alt).toBe('Custom alt');
  });

  it('returns an empty array for an absent ctaButtons field', () => {
    const raw = makeRawHeroStatementModule({ ctaButtons: null });

    const hero = toHeroStatementModule(raw);

    expect(hero.ctaButtons).toEqual([]);
  });

  it('returns an empty array when the ctaButtons array is present but empty', () => {
    const raw = makeRawHeroStatementModule({ ctaButtons: [] });

    const hero = toHeroStatementModule(raw);

    expect(hero.ctaButtons).toEqual([]);
  });

  it('maps a single PRIMARY button', () => {
    const raw = makeRawHeroStatementModule({
      ctaButtons: [makeRawCtaButton()],
    });

    const hero = toHeroStatementModule(raw);

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

  it('maps PRIMARY and SECONDARY buttons, preserving order', () => {
    const raw = makeRawHeroStatementModule({
      ctaButtons: [
        makeRawCtaButton({ variant: CTA_ACTION_VARIANT.PRIMARY }),
        makeRawCtaButton({
          variant: CTA_ACTION_VARIANT.SECONDARY,
          appearance: CTA_ACTION_APPEARANCE.INLINE,
          link: {
            label: 'Learn more',
            linkType: LINK_TYPE.EXTERNAL,
            url: '/learn-more',
            openInNewTab: null,
          },
        }),
      ],
    });

    const hero = toHeroStatementModule(raw);

    expect(hero.ctaButtons).toHaveLength(2);
    expect(hero.ctaButtons[0]).toMatchObject({
      variant: CTA_ACTION_VARIANT.PRIMARY,
    });
    expect(hero.ctaButtons[1]).toMatchObject({
      variant: CTA_ACTION_VARIANT.SECONDARY,
      appearance: CTA_ACTION_APPEARANCE.INLINE,
    });
  });

  it('drops a button whose link cannot resolve to an href', () => {
    const raw = makeRawHeroStatementModule({
      ctaButtons: [
        makeRawCtaButton({
          link: {
            label: 'Broken',
            linkType: LINK_TYPE.INTERNAL,
            internalReference: null,
            openInNewTab: null,
          },
        }),
      ],
    });

    const hero = toHeroStatementModule(raw);

    expect(hero.ctaButtons).toEqual([]);
  });

  it('takes contentPosition from contentPositionSplit on Split, ignoring contentPositionBanner', () => {
    const raw = makeRawHeroStatementModule({
      variant: HERO_VARIANT.SPLIT,
      contentPositionSplit: CONTENT_ALIGNMENT.RIGHT,
      contentPositionBanner: CONTENT_ALIGNMENT.LEFT,
    });

    const hero = toHeroStatementModule(raw);

    expect(hero.contentPosition).toBe(CONTENT_ALIGNMENT.RIGHT);
  });

  it('takes contentPosition from contentPositionBanner on Banner, ignoring contentPositionSplit', () => {
    const raw = makeRawHeroStatementModule({
      variant: HERO_VARIANT.BANNER,
      contentPositionSplit: CONTENT_ALIGNMENT.RIGHT,
      contentPositionBanner: CONTENT_ALIGNMENT.CENTER,
    });

    const hero = toHeroStatementModule(raw);

    expect(hero.contentPosition).toBe(CONTENT_ALIGNMENT.CENTER);
  });

  it('leaves contentPosition undefined on Stacked regardless of stored position keys', () => {
    const raw = makeRawHeroStatementModule({
      variant: HERO_VARIANT.STACKED,
      contentPositionSplit: CONTENT_ALIGNMENT.RIGHT,
      contentPositionBanner: CONTENT_ALIGNMENT.CENTER,
    });

    const hero = toHeroStatementModule(raw);

    expect(hero.contentPosition).toBeUndefined();
  });

  it('leaves contentAlignment undefined when unset', () => {
    const raw = makeRawHeroStatementModule({ contentAlignment: null });

    const hero = toHeroStatementModule(raw);

    expect(hero.contentAlignment).toBeUndefined();
  });

  it('maps contentAlignment when authored, independent of variant', () => {
    const raw = makeRawHeroStatementModule({
      contentAlignment: CONTENT_ALIGNMENT.CENTER,
    });

    const hero = toHeroStatementModule(raw);

    expect(hero.contentAlignment).toBe(CONTENT_ALIGNMENT.CENTER);
  });

  it('takes mediaOrder from mediaOrderSplit on Split, ignoring mediaOrderStacked', () => {
    const raw = makeRawHeroStatementModule({
      variant: HERO_VARIANT.SPLIT,
      mediaOrderSplit: MEDIA_ORDER.FIRST,
      mediaOrderStacked: MEDIA_ORDER.LAST,
    });

    const hero = toHeroStatementModule(raw);

    expect(hero.mediaOrder).toBe(MEDIA_ORDER.FIRST);
  });

  it('takes mediaOrder from mediaOrderStacked on Stacked, ignoring mediaOrderSplit', () => {
    const raw = makeRawHeroStatementModule({
      variant: HERO_VARIANT.STACKED,
      mediaOrderSplit: MEDIA_ORDER.FIRST,
      mediaOrderStacked: MEDIA_ORDER.LAST,
    });

    const hero = toHeroStatementModule(raw);

    expect(hero.mediaOrder).toBe(MEDIA_ORDER.LAST);
  });

  it('leaves mediaOrder undefined on Banner regardless of stored order keys', () => {
    const raw = makeRawHeroStatementModule({
      variant: HERO_VARIANT.BANNER,
      mediaOrderSplit: MEDIA_ORDER.FIRST,
      mediaOrderStacked: MEDIA_ORDER.FIRST,
    });

    const hero = toHeroStatementModule(raw);

    expect(hero.mediaOrder).toBeUndefined();
  });

  it('leaves layout undefined when unset (no faked default)', () => {
    const raw = makeRawHeroStatementModule({ layout: null });

    const hero = toHeroStatementModule(raw);

    expect(hero.layout).toBeUndefined();
  });

  it('maps a fully-authored layout object', () => {
    const raw = makeRawHeroStatementModule({
      layout: {
        spacingTop: 'LG',
        spacingBottom: 'SM',
        dividerTop: true,
        dividerBottom: false,
      },
    });

    const hero = toHeroStatementModule(raw);

    expect(hero.layout).toEqual({
      spacingTop: 'LG',
      spacingBottom: 'SM',
      containerWidth: undefined,
      dividerTop: true,
      dividerBottom: false,
    });
  });
});
