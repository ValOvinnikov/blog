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
import { faker } from '@faker-js/faker';

import { toFeatureListModule } from './transformer';

faker.seed(3);

const MOCK_FIRST_CARD_ID = faker.string.uuid();
const MOCK_SECOND_CARD_ID = faker.string.uuid();
const MOCK_ILLUSTRATION_ALT = faker.lorem.words(3);
const MOCK_CARD_LINK = {
  label: faker.lorem.words(2),
  url: faker.internet.url(),
};

describe(toFeatureListModule, () => {
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

  it('leaves contentAlignment and layout undefined when unset', () => {
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
        mockRawFeatureListItem({ _id: MOCK_FIRST_CARD_ID }),
        mockRawFeatureListItem({ _id: MOCK_SECOND_CARD_ID }),
      ],
    });

    const module = toFeatureListModule(raw);

    expect(module.items.map((item) => item.id)).toEqual([
      MOCK_FIRST_CARD_ID,
      MOCK_SECOND_CARD_ID,
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
    [
      'only an image',
      null,
      MOCK_ILLUSTRATION_ALT,
      undefined,
      MOCK_ILLUSTRATION_ALT,
    ],
    [
      'an icon and an image',
      ICONS.ROCKET,
      MOCK_ILLUSTRATION_ALT,
      ICONS.ROCKET,
      MOCK_ILLUSTRATION_ALT,
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
            label: MOCK_CARD_LINK.label,
            linkType: LINK_TYPE.EXTERNAL,
            url: MOCK_CARD_LINK.url,
            internalReference: null,
            openInNewTab: null,
          },
        }),
        mockRawFeatureListItem(),
      ],
    });

    const module = toFeatureListModule(raw);

    expect(module.items[0]?.link).toEqual(
      mockLinkView({ label: MOCK_CARD_LINK.label, href: MOCK_CARD_LINK.url }),
    );
  });

  it('maps authored ctaButtons', () => {
    const raw = mockRawFeatureListModule({
      ctaButtons: [mockRawCtaButton()],
    });

    const module = toFeatureListModule(raw);

    expect(module.ctaButtons).toEqual([mockCtaButtonView()]);
  });
});
