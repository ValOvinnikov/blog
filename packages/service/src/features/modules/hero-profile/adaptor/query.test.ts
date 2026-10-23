import { BRAND_VARIANT, HERO_VARIANT } from '@blog/config';
import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { MOCK_HERO_MODULE_ID } from '@blog/service/testing/pages/fixtures';
import { mockReference } from '@blog/service/testing/shared/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import {
  mockLocalizedHeadingBlock,
  mockLocalizedStrings,
} from '@blog/service/testing/shared/localized';

import { heroProfileModuleQuery } from './query';

const { EN, NL, FR } = LOCALE_ISO_CODES;

const EN_EYEBROW = 'Founder';
const NL_EYEBROW = 'Oprichter';

const person = { _id: 'person-1', _type: 'person', name: 'Jane Doe' };

const heroDocument = {
  _id: MOCK_HERO_MODULE_ID,
  _type: 'module_heroProfile',
  brandVariant: BRAND_VARIANT.PRIMARY,
  variant: HERO_VARIANT.SPLIT,
  headingBlock: mockLocalizedHeadingBlock({
    [EN]: 'Meet Jane',
    [NL]: 'Maak kennis',
  }),
  eyebrow: mockLocalizedStrings({ [EN]: EN_EYEBROW, [NL]: NL_EYEBROW }),
  author: mockReference(person._id),
};

async function runHero(document: Record<string, unknown>, locale: string) {
  const raw = await evaluateGroqExpression(
    heroProfileModuleQuery.query,
    [document, person],
    undefined,
    { id: MOCK_HERO_MODULE_ID, locale, defaultLocale: EN },
  );

  return heroProfileModuleQuery.parse(raw);
}

describe('heroProfileModuleQuery', () => {
  it.each([
    ['picks the eyebrow in the visitor language', NL, NL_EYEBROW],
    ['falls back to the default-language eyebrow', FR, EN_EYEBROW],
  ])('%s', async (_, locale, expected) => {
    const hero = await runHero(heroDocument, locale);

    expect(hero.eyebrow).toBe(expected);
  });

  it('leaves the eyebrow null when no language has a value', async () => {
    const hero = await runHero({ ...heroDocument, eyebrow: undefined }, NL);

    expect(hero.eyebrow).toBeNull();
  });

  it('loads the hero without an image when Studio left an image with no asset', async () => {
    const hero = await runHero(
      {
        ...heroDocument,
        image: { _type: 'localizedImageWithAlt', alt: [{ language: EN }] },
      },
      EN,
    );

    expect(hero).toMatchObject({
      image: { asset: null, alt: null },
      eyebrow: EN_EYEBROW,
    });
  });

  describe('in the default language', () => {
    let hero: Awaited<ReturnType<typeof runHero>>;

    beforeEach(async () => {
      hero = await runHero(heroDocument, EN);
    });

    it('shows role, bio and social links for a document authored without the toggles', () => {
      expect(hero).toMatchObject({
        showSocialLinks: true,
        showRole: true,
        showBio: true,
      });
    });

    it('resolves the author reference', () => {
      expect(hero.author).toMatchObject({ _id: person._id, name: person.name });
    });
  });
});
