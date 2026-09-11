import {
  BRAND_VARIANT,
  CONTENT_ALIGNMENT,
  CTA_ACTION_APPEARANCE,
  CTA_ACTION_VARIANT,
  HERO_VARIANT,
  MEDIA_ORDER,
} from '@blog/config';
import {
  makeRawCtaAction,
  makeRawHeroStatementModule,
} from '@blog/service/testing/modules/fixtures';
import {
  makeRawHeadingBlock,
  makeRawSanityImage,
} from '@blog/service/testing/shared/fixtures';
import { makeTenant } from '@blog/service/testing/tenant';

import { toHeroStatementModule } from './transformer';

const tenant = makeTenant();

describe(toHeroStatementModule, () => {
  it('maps brandVariant, variant and heading straight through', () => {
    const raw = makeRawHeroStatementModule({
      brandVariant: BRAND_VARIANT.BRAND_PRIMARY,
      variant: HERO_VARIANT.BANNER,
      headingBlock: makeRawHeadingBlock('Ship confidently'),
    });

    const hero = toHeroStatementModule(raw, tenant);

    expect(hero.brandVariant).toBe(BRAND_VARIANT.BRAND_PRIMARY);
    expect(hero.variant).toBe(HERO_VARIANT.BANNER);
    expect(hero.heading).toBe('Ship confidently');
  });

  it('leaves eyebrow and supportingText undefined when unset', () => {
    const raw = makeRawHeroStatementModule({
      eyebrow: null,
      headingBlock: makeRawHeadingBlock('Statement heading', {
        supportingText: null,
      }),
    });

    const hero = toHeroStatementModule(raw, tenant);

    expect(hero.eyebrow).toBeUndefined();
    expect(hero.supportingText).toBeUndefined();
  });

  it('maps an authored eyebrow and supportingText', () => {
    const raw = makeRawHeroStatementModule({
      eyebrow: 'Field notes',
      headingBlock: makeRawHeadingBlock('Statement heading', {
        supportingText: 'Supporting copy.',
      }),
    });

    const hero = toHeroStatementModule(raw, tenant);

    expect(hero.eyebrow).toBe('Field notes');
    expect(hero.supportingText).toBe('Supporting copy.');
  });

  it('leaves sanityImage undefined when unset', () => {
    const raw = makeRawHeroStatementModule({ image: null });

    const hero = toHeroStatementModule(raw, tenant);

    expect(hero.sanityImage).toBeUndefined();
  });

  it('maps an authored image', () => {
    const raw = makeRawHeroStatementModule({
      image: makeRawSanityImage('Custom alt'),
    });

    const hero = toHeroStatementModule(raw, tenant);

    expect(hero.sanityImage?.alt).toBe('Custom alt');
  });

  it('leaves actions undefined when the group is unset', () => {
    const raw = makeRawHeroStatementModule({ actions: null });

    const hero = toHeroStatementModule(raw, tenant);

    expect(hero.actions).toBeUndefined();
  });

  it('leaves actions undefined when the group has an empty actions array', () => {
    const raw = makeRawHeroStatementModule({ actions: { actions: [] } });

    const hero = toHeroStatementModule(raw, tenant);

    expect(hero.actions).toBeUndefined();
  });

  it('maps authored actions through toCtaAction', () => {
    const raw = makeRawHeroStatementModule({
      actions: {
        actions: [
          makeRawCtaAction({
            variant: CTA_ACTION_VARIANT.PRIMARY,
            appearance: CTA_ACTION_APPEARANCE.CONTAINED,
          }),
        ],
      },
    });

    const hero = toHeroStatementModule(raw, tenant);

    expect(hero.actions).toEqual([
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
    const raw = makeRawHeroStatementModule({
      variant: HERO_VARIANT.SPLIT,
      contentPositionSplit: CONTENT_ALIGNMENT.RIGHT,
      contentPositionBanner: CONTENT_ALIGNMENT.LEFT,
    });

    const hero = toHeroStatementModule(raw, tenant);

    expect(hero.contentPosition).toBe(CONTENT_ALIGNMENT.RIGHT);
  });

  it('takes contentPosition from contentPositionBanner on Banner, ignoring contentPositionSplit', () => {
    const raw = makeRawHeroStatementModule({
      variant: HERO_VARIANT.BANNER,
      contentPositionSplit: CONTENT_ALIGNMENT.RIGHT,
      contentPositionBanner: CONTENT_ALIGNMENT.CENTER,
    });

    const hero = toHeroStatementModule(raw, tenant);

    expect(hero.contentPosition).toBe(CONTENT_ALIGNMENT.CENTER);
  });

  it('leaves contentPosition undefined on Stacked regardless of stored position keys', () => {
    const raw = makeRawHeroStatementModule({
      variant: HERO_VARIANT.STACKED,
      contentPositionSplit: CONTENT_ALIGNMENT.RIGHT,
      contentPositionBanner: CONTENT_ALIGNMENT.CENTER,
    });

    const hero = toHeroStatementModule(raw, tenant);

    expect(hero.contentPosition).toBeUndefined();
  });

  it('leaves contentAlignment undefined when unset', () => {
    const raw = makeRawHeroStatementModule({ contentAlignment: null });

    const hero = toHeroStatementModule(raw, tenant);

    expect(hero.contentAlignment).toBeUndefined();
  });

  it('maps contentAlignment when authored, independent of variant', () => {
    const raw = makeRawHeroStatementModule({
      contentAlignment: CONTENT_ALIGNMENT.CENTER,
    });

    const hero = toHeroStatementModule(raw, tenant);

    expect(hero.contentAlignment).toBe(CONTENT_ALIGNMENT.CENTER);
  });

  it('takes mediaOrder from mediaOrderSplit on Split, ignoring mediaOrderStacked', () => {
    const raw = makeRawHeroStatementModule({
      variant: HERO_VARIANT.SPLIT,
      mediaOrderSplit: MEDIA_ORDER.FIRST,
      mediaOrderStacked: MEDIA_ORDER.LAST,
    });

    const hero = toHeroStatementModule(raw, tenant);

    expect(hero.mediaOrder).toBe(MEDIA_ORDER.FIRST);
  });

  it('takes mediaOrder from mediaOrderStacked on Stacked, ignoring mediaOrderSplit', () => {
    const raw = makeRawHeroStatementModule({
      variant: HERO_VARIANT.STACKED,
      mediaOrderSplit: MEDIA_ORDER.FIRST,
      mediaOrderStacked: MEDIA_ORDER.LAST,
    });

    const hero = toHeroStatementModule(raw, tenant);

    expect(hero.mediaOrder).toBe(MEDIA_ORDER.LAST);
  });

  it('leaves mediaOrder undefined on Banner regardless of stored order keys', () => {
    const raw = makeRawHeroStatementModule({
      variant: HERO_VARIANT.BANNER,
      mediaOrderSplit: MEDIA_ORDER.FIRST,
      mediaOrderStacked: MEDIA_ORDER.FIRST,
    });

    const hero = toHeroStatementModule(raw, tenant);

    expect(hero.mediaOrder).toBeUndefined();
  });

  it('leaves layout undefined when unset (no faked default)', () => {
    const raw = makeRawHeroStatementModule({ layout: null });

    const hero = toHeroStatementModule(raw, tenant);

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

    const hero = toHeroStatementModule(raw, tenant);

    expect(hero.layout).toEqual({
      spacingTop: 'LG',
      spacingBottom: 'SM',
      containerWidth: undefined,
      dividerTop: true,
      dividerBottom: false,
    });
  });
});
