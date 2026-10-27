import {
  BRAND_VARIANT,
  DISPLAY_MODE,
  LOCALE_ISO_CODES,
} from '@blog/config/constants';
import {
  mockRawLogoItem,
  mockRawLogoWallModule,
} from '@blog/service/testing/modules/fixtures';
import { mockReference } from '@blog/service/testing/shared/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import {
  MOCK_IMAGE_ASSET_DOCUMENT,
  MOCK_IMAGE_ASSET_DOCUMENT_ID,
  mockLocalizedHeadingBlock,
} from '@blog/service/testing/shared/localized';
import { faker } from '@faker-js/faker';

import { logoWallModuleQuery } from './query';

const { EN, NL, FR } = LOCALE_ISO_CODES;

faker.seed(6014);

const MOCK_LOGO_WALL_ID = faker.string.uuid();
const MOCK_ENGLISH_HEADING = faker.lorem.words(3);
const MOCK_DUTCH_HEADING = faker.lorem.words(3);

const MOCK_LOGO_WALL_DOCUMENT = {
  _id: MOCK_LOGO_WALL_ID,
  _type: 'module_logoWall',
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: mockLocalizedHeadingBlock({
    [EN]: MOCK_ENGLISH_HEADING,
    [NL]: MOCK_DUTCH_HEADING,
  }),
  logos: [
    {
      _key: faker.string.uuid(),
      _type: 'logoItem',
      name: faker.company.name(),
      image: {
        _type: 'image',
        asset: mockReference(MOCK_IMAGE_ASSET_DOCUMENT_ID),
      },
    },
  ],
};

async function runLogoWall(locale: string) {
  const raw = await evaluateGroqExpression(
    logoWallModuleQuery.query,
    [MOCK_LOGO_WALL_DOCUMENT, MOCK_IMAGE_ASSET_DOCUMENT],
    undefined,
    { id: MOCK_LOGO_WALL_ID, locale, defaultLocale: EN },
  );

  return logoWallModuleQuery.parse(raw);
}

describe('logoWallModuleQuery', () => {
  it.each([
    ['a module with no headingBlock', { headingBlock: null }],
    ['a module with no logos', { logos: null }],
    [
      'a logo with no image',
      { logos: [{ ...mockRawLogoItem(), image: null }] },
    ],
    ['a logo with no name', { logos: [{ ...mockRawLogoItem(), name: null }] }],
  ])('rejects %s', (_, overrides) => {
    const raw = { ...mockRawLogoWallModule(), ...overrides };

    expect(() => logoWallModuleQuery.parse(raw)).toThrow();
  });

  it('parses a logo with no link', () => {
    const raw = {
      ...mockRawLogoWallModule(),
      logos: [{ ...mockRawLogoItem(), link: null }],
    };

    expect(logoWallModuleQuery.parse(raw).logos?.[0]?.link).toBeNull();
  });

  it('parses a logo whose dark-background image has no asset', () => {
    const raw = {
      ...mockRawLogoWallModule(),
      logos: [
        {
          ...mockRawLogoItem(),
          imageDark: { asset: null, hotspot: null, crop: null },
        },
      ],
    };

    expect(() => logoWallModuleQuery.parse(raw)).not.toThrow();
  });

  it('defaults displayMode to GRID for a document authored without it', async () => {
    const { displayMode } = await runLogoWall(EN);

    expect(displayMode).toBe(DISPLAY_MODE.GRID);
  });

  it('picks the heading in the visitor language', async () => {
    const { headingBlock } = await runLogoWall(NL);

    expect(headingBlock.heading).toBe(MOCK_DUTCH_HEADING);
  });

  it('falls back to the default language for the heading', async () => {
    const { headingBlock } = await runLogoWall(FR);

    expect(headingBlock.heading).toBe(MOCK_ENGLISH_HEADING);
  });

  it('reads a logo name the same in every language', async () => {
    const [english, dutch] = await Promise.all([
      runLogoWall(EN),
      runLogoWall(NL),
    ]);

    expect(dutch.logos.map(({ name }) => name)).toEqual(
      english.logos.map(({ name }) => name),
    );
  });
});
