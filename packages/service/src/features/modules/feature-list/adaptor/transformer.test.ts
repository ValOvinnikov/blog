import {
  BRAND_VARIANT,
  CARD_IMAGE_SHAPE,
  CONTENT_ALIGNMENT,
  DISPLAY_MODE,
  LINK_TYPE,
} from '@blog/config';
import {
  makeRawCtaButton,
  makeRawFeatureListItem,
  makeRawFeatureListModule,
} from '@blog/service/testing/modules/fixtures';
import { makeRawSanityImage } from '@blog/service/testing/shared/fixtures';

import { toFeatureListModule } from './transformer';

describe('toFeatureListModule', () => {
  it('maps brandVariant, headingBlock, imageShape, displayMode and cardAlignment straight through', () => {
    const raw = makeRawFeatureListModule({
      brandVariant: BRAND_VARIANT.SECONDARY,
      imageShape: CARD_IMAGE_SHAPE.CIRCLE,
      displayMode: DISPLAY_MODE.CAROUSEL,
      cardAlignment: CONTENT_ALIGNMENT.CENTER,
    });

    const module = toFeatureListModule(raw);

    expect(module.brandVariant).toBe(BRAND_VARIANT.SECONDARY);
    expect(module.imageShape).toBe(CARD_IMAGE_SHAPE.CIRCLE);
    expect(module.displayMode).toBe(DISPLAY_MODE.CAROUSEL);
    expect(module.cardAlignment).toBe(CONTENT_ALIGNMENT.CENTER);
  });

  it('leaves contentAlignment and layout undefined when unset (no faked default)', () => {
    const raw = makeRawFeatureListModule({
      contentAlignment: null,
      layout: null,
    });

    const module = toFeatureListModule(raw);

    expect(module.contentAlignment).toBeUndefined();
    expect(module.layout).toBeUndefined();
  });

  it('keeps the cards in authored order', () => {
    const raw = makeRawFeatureListModule({
      features: [
        makeRawFeatureListItem({ _id: 'card-b' }),
        makeRawFeatureListItem({ _id: 'card-a' }),
      ],
    });

    const module = toFeatureListModule(raw);

    expect(module.items.map((item) => item.id)).toEqual(['card-b', 'card-a']);
  });

  it('degrades to an empty items array when features is unset (no throw)', () => {
    const raw = makeRawFeatureListModule({ features: null });

    const module = toFeatureListModule(raw);

    expect(module.items).toEqual([]);
  });

  it('degrades to an empty items array when features is present but empty', () => {
    const raw = makeRawFeatureListModule({ features: [] });

    const module = toFeatureListModule(raw);

    expect(module.items).toEqual([]);
  });

  it('degrades to an empty items array when features has only one card (below the schema minimum)', () => {
    const raw = makeRawFeatureListModule({
      features: [makeRawFeatureListItem()],
    });

    const module = toFeatureListModule(raw);

    expect(module.items).toEqual([]);
  });

  it('maps a card with only an icon, leaving sanityImage undefined', () => {
    const raw = makeRawFeatureListModule({
      features: [
        makeRawFeatureListItem({ icon: 'ROCKET', image: null }),
        makeRawFeatureListItem(),
      ],
    });

    const module = toFeatureListModule(raw);

    expect(module.items[0]).toMatchObject({ icon: 'ROCKET' });
    expect(module.items[0]?.sanityImage).toBeUndefined();
  });

  it('maps a card with only an image, leaving icon undefined', () => {
    const raw = makeRawFeatureListModule({
      features: [
        makeRawFeatureListItem({
          icon: null,
          image: makeRawSanityImage('A feature illustration'),
        }),
        makeRawFeatureListItem(),
      ],
    });

    const module = toFeatureListModule(raw);

    expect(module.items[0]?.icon).toBeUndefined();
    expect(module.items[0]?.sanityImage?.alt).toBe('A feature illustration');
  });

  it('maps a card carrying both an icon and an image', () => {
    const raw = makeRawFeatureListModule({
      features: [
        makeRawFeatureListItem({
          icon: 'ROCKET',
          image: makeRawSanityImage('A feature illustration'),
        }),
        makeRawFeatureListItem(),
      ],
    });

    const module = toFeatureListModule(raw);

    expect(module.items[0]?.icon).toBe('ROCKET');
    expect(module.items[0]?.sanityImage?.alt).toBe('A feature illustration');
  });

  it('leaves a card with neither icon nor image fully undefined for both', () => {
    const raw = makeRawFeatureListModule({
      features: [
        makeRawFeatureListItem({ icon: null, image: null }),
        makeRawFeatureListItem(),
      ],
    });

    const module = toFeatureListModule(raw);

    expect(module.items[0]?.icon).toBeUndefined();
    expect(module.items[0]?.sanityImage).toBeUndefined();
  });

  it('resolves a card link to an ILink', () => {
    const raw = makeRawFeatureListModule({
      features: [
        makeRawFeatureListItem({
          link: {
            label: 'Learn more',
            linkType: LINK_TYPE.EXTERNAL,
            url: 'https://example.com',
            internalReference: null,
            openInNewTab: null,
          },
        }),
        makeRawFeatureListItem(),
      ],
    });

    const module = toFeatureListModule(raw);

    expect(module.items[0]?.link).toEqual({
      label: 'Learn more',
      href: 'https://example.com',
      target: undefined,
      platform: undefined,
      ariaLabel: undefined,
    });
  });

  it('leaves a card link undefined when the card has none', () => {
    const raw = makeRawFeatureListModule({
      features: [
        makeRawFeatureListItem({ link: null }),
        makeRawFeatureListItem(),
      ],
    });

    const module = toFeatureListModule(raw);

    expect(module.items[0]?.link).toBeUndefined();
  });

  it('drops a card link that cannot resolve to an href', () => {
    const raw = makeRawFeatureListModule({
      features: [
        makeRawFeatureListItem({
          link: {
            label: 'Broken',
            linkType: LINK_TYPE.INTERNAL,
            internalReference: null,
            url: null,
            openInNewTab: null,
          },
        }),
        makeRawFeatureListItem(),
      ],
    });

    const module = toFeatureListModule(raw);

    expect(module.items[0]?.link).toBeUndefined();
  });

  it('returns an empty array for an absent ctaButtons field', () => {
    const raw = makeRawFeatureListModule({ ctaButtons: null });

    const module = toFeatureListModule(raw);

    expect(module.ctaButtons).toEqual([]);
  });

  it('maps authored ctaButtons', () => {
    const raw = makeRawFeatureListModule({
      ctaButtons: [makeRawCtaButton()],
    });

    const module = toFeatureListModule(raw);

    expect(module.ctaButtons).toHaveLength(1);
    expect(module.ctaButtons[0]).toMatchObject({
      link: { label: 'Subscribe', href: '/newsletter' },
    });
  });
});
