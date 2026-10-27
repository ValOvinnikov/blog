import {
  BRAND_VARIANT,
  CTA_ACTION_APPEARANCE,
  HERO_VARIANT,
  LOCALE_ISO_CODES,
  POST_SOURCE,
} from '@blog/config/constants';
import { MOCK_HERO_MODULE_ID } from '@blog/service/testing/pages/fixtures';
import { mockReference } from '@blog/service/testing/shared/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import {
  MOCK_IMAGE_ASSET_DOCUMENT,
  mockLocalizedImage,
  mockLocalizedStrings,
} from '@blog/service/testing/shared/localized';
import {
  MOCK_DESIGN_EN_POST_ID,
  MOCK_DESIGN_NL_POST_ID,
  MOCK_ONLY_EN_POST_ID,
  MOCK_PINNED_POST_DOCUMENTS,
  MOCK_SOLO_NL_POST_ID,
} from '@blog/service/testing/shared/translated-posts-dataset';
import { faker } from '@faker-js/faker';

import { heroBlogModuleQuery } from './query';

faker.seed(6014);

const { EN, NL, FR } = LOCALE_ISO_CODES;

const MOCK_EN_COPY = {
  eyebrow: faker.lorem.word(),
  primaryActionLabel: faker.lorem.words(3),
  alt: faker.lorem.words(2),
};

const MOCK_NL_COPY = {
  eyebrow: faker.lorem.word(),
  primaryActionLabel: faker.lorem.words(3),
  alt: faker.lorem.words(2),
};

const MOCK_DELETED_POST_ID = faker.string.uuid();

const MOCK_HERO_DOCUMENT = {
  _id: MOCK_HERO_MODULE_ID,
  _type: 'module_heroBlog',
  brandVariant: BRAND_VARIANT.PRIMARY,
  variant: HERO_VARIANT.SPLIT,
  postSource: POST_SOURCE.NEWEST_FEATURED,
  primaryActionAppearance: CTA_ACTION_APPEARANCE.CONTAINED,
  eyebrow: mockLocalizedStrings({
    [EN]: MOCK_EN_COPY.eyebrow,
    [NL]: MOCK_NL_COPY.eyebrow,
  }),
  primaryActionLabel: mockLocalizedStrings({
    [EN]: MOCK_EN_COPY.primaryActionLabel,
    [NL]: MOCK_NL_COPY.primaryActionLabel,
  }),
  image: mockLocalizedImage({ [EN]: MOCK_EN_COPY.alt, [NL]: MOCK_NL_COPY.alt }),
};

async function evaluateHero(
  module: Record<string, unknown>,
  locale: string,
  dataset: unknown[] = [],
) {
  return evaluateGroqExpression(
    heroBlogModuleQuery.query,
    [
      { ...MOCK_HERO_DOCUMENT, ...module },
      MOCK_IMAGE_ASSET_DOCUMENT,
      ...dataset,
    ],
    undefined,
    { id: MOCK_HERO_MODULE_ID, locale, defaultLocale: EN },
  );
}

async function runHero(module: Record<string, unknown>, locale: string) {
  return heroBlogModuleQuery.parse(await evaluateHero(module, locale));
}

describe('heroBlogModuleQuery', () => {
  it.each([
    [
      'picks the eyebrow, action label and image alt in the visitor language',
      NL,
      MOCK_NL_COPY,
    ],
    [
      'falls back to the default language when the visitor language is missing',
      FR,
      MOCK_EN_COPY,
    ],
  ])('%s', async (_, locale, copy) => {
    const { eyebrow, primaryActionLabel, image } = await runHero({}, locale);

    expect({ eyebrow, primaryActionLabel, alt: image?.alt }).toEqual({
      eyebrow: copy.eyebrow,
      primaryActionLabel: copy.primaryActionLabel,
      alt: copy.alt,
    });
  });

  it('leaves the eyebrow null when no language has a value', async () => {
    const hero = await runHero({ eyebrow: undefined }, NL);

    expect(hero.eyebrow).toBeNull();
  });

  it('fails when the action label is missing in every language', async () => {
    await expect(
      runHero({ primaryActionLabel: undefined }, NL),
    ).rejects.toThrow();
  });

  describe('language scoping', () => {
    async function runRaw(module: Record<string, unknown>, locale: string) {
      return (await evaluateHero(
        module,
        locale,
        MOCK_PINNED_POST_DOCUMENTS,
      )) as {
        post: { _id: string } | null;
        hasPinnedPost: boolean;
      };
    }

    async function runPost(module: Record<string, unknown>, locale: string) {
      const raw = await runRaw(module, locale);

      return raw.post?._id ?? null;
    }

    function pinned(id: string) {
      return {
        postSource: POST_SOURCE.PINNED,
        post: mockReference(id),
      };
    }

    it.each([
      [
        'shows the pinned post in its own language',
        MOCK_DESIGN_EN_POST_ID,
        EN,
        MOCK_DESIGN_EN_POST_ID,
      ],
      [
        'swaps the pinned post for its translation',
        MOCK_DESIGN_EN_POST_ID,
        NL,
        MOCK_DESIGN_NL_POST_ID,
      ],
      [
        'shows no post when the pinned one has no translation',
        MOCK_ONLY_EN_POST_ID,
        NL,
        null,
      ],
      [
        'shows a group-less pinned post in its own language',
        MOCK_SOLO_NL_POST_ID,
        NL,
        MOCK_SOLO_NL_POST_ID,
      ],
      [
        'shows no post for a group-less pinned post in another language',
        MOCK_SOLO_NL_POST_ID,
        EN,
        null,
      ],
    ])('%s', async (_, pinnedId, locale, expected) => {
      const postId = await runPost(pinned(pinnedId), locale);

      expect(postId).toBe(expected);
    });

    it.each([
      [EN, MOCK_ONLY_EN_POST_ID],
      [NL, MOCK_DESIGN_NL_POST_ID],
    ])(
      'falls back to the newest featured post in %s',
      async (locale, expected) => {
        const postId = await runPost({}, locale);

        expect(postId).toBe(expected);
      },
    );

    it.each([
      [
        'as existing when it has no version in the request language',
        pinned(MOCK_ONLY_EN_POST_ID),
        true,
      ],
      [
        'as absent when the reference points at a missing document',
        pinned(MOCK_DELETED_POST_ID),
        false,
      ],
      ['as absent in newest-featured mode', {}, false],
    ])('reports the pinned post %s', async (_, module, expected) => {
      const { hasPinnedPost } = await runRaw(module, NL);

      expect(hasPinnedPost).toBe(expected);
    });
  });
});
