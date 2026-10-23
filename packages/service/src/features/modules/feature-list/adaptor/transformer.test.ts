import {
  BRAND_VARIANT,
  CARD_IMAGE_SHAPE,
  CONTENT_ALIGNMENT,
  DISPLAY_MODE,
  ICONS,
  LINK_TYPE,
} from '@blog/config';
import {
  mockCtaButtonView,
  mockRawCtaButton,
  mockRawFeatureListItem,
  mockRawFeatureListModule,
} from '@blog/service/testing/modules/fixtures';
import {
  mockLinkView,
  mockRawSanityImage,
} from '@blog/service/testing/shared/fixtures';

import { toFeatureListModule } from './transformer';

const FIRST_CARD_ID = 'card-b';
const SECOND_CARD_ID = 'card-a';
const ILLUSTRATION_ALT = 'A feature illustration';
const CARD_LINK = { label: 'Learn more', url: 'https://example.com' };

describe('toFeatureListModule', () => {
  it('maps brandVariant, imageShape, displayMode and cardAlignment straight through', () => {
    const raw = mockRawFeatureListModule({
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
    const raw = mockRawFeatureListModule({
      contentAlignment: null,
      layout: null,
    });

    const module = toFeatureListModule(raw);

    expect(module.contentAlignment).toBeUndefined();
    expect(module.layout).toBeUndefined();
  });

  it('keeps the cards in authored order', () => {
    const raw = mockRawFeatureListModule({
      features: [
        mockRawFeatureListItem({ _id: FIRST_CARD_ID }),
        mockRawFeatureListItem({ _id: SECOND_CARD_ID }),
      ],
    });

    const module = toFeatureListModule(raw);

    expect(module.items.map((item) => item.id)).toEqual([
      FIRST_CARD_ID,
      SECOND_CARD_ID,
    ]);
  });

  it.each([
    ['unset', null],
    ['an empty list', []],
    ['a single card, below the schema minimum', [mockRawFeatureListItem()]],
  ])('degrades to an empty items array when features is %s', (_, features) => {
    const raw = mockRawFeatureListModule({ features });

    const module = toFeatureListModule(raw);

    expect(module.items).toEqual([]);
  });

  it.each([
    ['only an icon', ICONS.ROCKET, null, ICONS.ROCKET, undefined],
    ['only an image', null, ILLUSTRATION_ALT, undefined, ILLUSTRATION_ALT],
    [
      'an icon and an image',
      ICONS.ROCKET,
      ILLUSTRATION_ALT,
      ICONS.ROCKET,
      ILLUSTRATION_ALT,
    ],
    ['neither icon nor image', null, null, undefined, undefined],
  ])(
    'maps a card carrying %s',
    (_, icon, imageAlt, expectedIcon, expectedAlt) => {
      const raw = mockRawFeatureListModule({
        features: [
          mockRawFeatureListItem({
            icon,
            image: imageAlt ? mockRawSanityImage(imageAlt) : null,
          }),
          mockRawFeatureListItem(),
        ],
      });

      const module = toFeatureListModule(raw);

      expect(module.items[0]?.icon).toBe(expectedIcon);
      expect(module.items[0]?.sanityImage?.alt).toBe(expectedAlt);
    },
  );

  it('resolves a card link to an ILink', () => {
    const raw = mockRawFeatureListModule({
      features: [
        mockRawFeatureListItem({
          link: {
            label: CARD_LINK.label,
            linkType: LINK_TYPE.EXTERNAL,
            url: CARD_LINK.url,
            internalReference: null,
            openInNewTab: null,
          },
        }),
        mockRawFeatureListItem(),
      ],
    });

    const module = toFeatureListModule(raw);

    expect(module.items[0]?.link).toEqual(
      mockLinkView({ label: CARD_LINK.label, href: CARD_LINK.url }),
    );
  });

  it('maps authored ctaButtons', () => {
    const raw = mockRawFeatureListModule({
      ctaButtons: [mockRawCtaButton()],
    });

    const module = toFeatureListModule(raw);

    expect(module.ctaButtons).toHaveLength(1);
    expect(module.ctaButtons[0]).toEqual(mockCtaButtonView());
  });
});
