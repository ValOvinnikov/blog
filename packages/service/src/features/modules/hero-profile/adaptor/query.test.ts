import { BRAND_VARIANT, HERO_VARIANT } from '@blog/config';
import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { MOCK_HERO_MODULE_ID } from '@blog/service/testing/pages/fixtures';
import { mockReference } from '@blog/service/testing/shared/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import {
  mockLocalizedHeadingBlock,
  mockLocalizedStrings,
} from '@blog/service/testing/shared/localized';
import { faker } from '@faker-js/faker';

import { heroProfileModuleQuery } from './query';

faker.seed(6014);

const { EN, NL, FR } = LOCALE_ISO_CODES;

const MOCK_EN_EYEBROW = faker.lorem.words(2);
const MOCK_NL_EYEBROW = faker.lorem.words(2);

const MOCK_PERSON = {
  _id: faker.string.uuid(),
  _type: 'person',
  name: faker.person.fullName(),
};

const MOCK_HERO_DOCUMENT = {
  _id: MOCK_HERO_MODULE_ID,
  _type: 'module_heroProfile',
  brandVariant: BRAND_VARIANT.PRIMARY,
  variant: HERO_VARIANT.SPLIT,
  headingBlock: mockLocalizedHeadingBlock({
    [EN]: faker.lorem.words(2),
    [NL]: faker.lorem.words(2),
  }),
  eyebrow: mockLocalizedStrings({
    [EN]: MOCK_EN_EYEBROW,
    [NL]: MOCK_NL_EYEBROW,
  }),
  author: mockReference(MOCK_PERSON._id),
};

async function runHero(document: Record<string, unknown>, locale: string) {
  const raw = await evaluateGroqExpression(
    heroProfileModuleQuery.query,
    [document, MOCK_PERSON],
    undefined,
    { id: MOCK_HERO_MODULE_ID, locale, defaultLocale: EN },
  );

  return heroProfileModuleQuery.parse(raw);
}

describe('heroProfileModuleQuery', () => {
  it.each([
    ['picks the eyebrow in the visitor language', NL, MOCK_NL_EYEBROW],
    ['falls back to the default-language eyebrow', FR, MOCK_EN_EYEBROW],
  ])('%s', async (_, locale, expected) => {
    const hero = await runHero(MOCK_HERO_DOCUMENT, locale);

    expect(hero.eyebrow).toBe(expected);
  });

  it('leaves the eyebrow null when no language has a value', async () => {
    const hero = await runHero(
      { ...MOCK_HERO_DOCUMENT, eyebrow: undefined },
      NL,
    );

    expect(hero.eyebrow).toBeNull();
  });

  it('loads the hero when Studio left an image with no asset', async () => {
    const hero = await runHero(
      {
        ...MOCK_HERO_DOCUMENT,
        image: { _type: 'localizedImageWithAlt', alt: [{ language: EN }] },
      },
      EN,
    );

    const { asset, alt } = hero.image ?? {};

    expect({ asset, alt }).toEqual({ asset: null, alt: null });
    expect(hero.eyebrow).toBe(MOCK_EN_EYEBROW);
  });

  describe('in the default language', () => {
    let hero: Awaited<ReturnType<typeof runHero>>;

    beforeEach(async () => {
      hero = await runHero(MOCK_HERO_DOCUMENT, EN);
    });

    it('shows role, bio and social links when the toggles are not authored', () => {
      const { showSocialLinks, showRole, showBio } = hero;

      expect({ showSocialLinks, showRole, showBio }).toEqual({
        showSocialLinks: true,
        showRole: true,
        showBio: true,
      });
    });

    it('resolves the author reference', () => {
      const { _id, name } = hero.author;

      expect({ _id, name }).toEqual({
        _id: MOCK_PERSON._id,
        name: MOCK_PERSON.name,
      });
    });
  });
});
