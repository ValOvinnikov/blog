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

import { heroBlogModuleQuery } from './query';

const { EN, NL, FR } = LOCALE_ISO_CODES;

const EN_COPY = {
  eyebrow: 'Featured',
  primaryActionLabel: 'Read the post',
  alt: 'A desk',
};

const NL_COPY = {
  eyebrow: 'Uitgelicht',
  primaryActionLabel: 'Lees het bericht',
  alt: 'Een bureau',
};

const heroDocument = {
  _id: MOCK_HERO_MODULE_ID,
  _type: 'module_heroBlog',
  brandVariant: BRAND_VARIANT.PRIMARY,
  variant: HERO_VARIANT.SPLIT,
  postSource: POST_SOURCE.NEWEST_FEATURED,
  primaryActionAppearance: CTA_ACTION_APPEARANCE.CONTAINED,
  eyebrow: mockLocalizedStrings({
    [EN]: EN_COPY.eyebrow,
    [NL]: NL_COPY.eyebrow,
  }),
  primaryActionLabel: mockLocalizedStrings({
    [EN]: EN_COPY.primaryActionLabel,
    [NL]: NL_COPY.primaryActionLabel,
  }),
  image: mockLocalizedImage({ [EN]: EN_COPY.alt, [NL]: NL_COPY.alt }),
};

async function runHero(document: Record<string, unknown>, locale: string) {
  const raw = await evaluateGroqExpression(
    heroBlogModuleQuery.query,
    [document, MOCK_IMAGE_ASSET_DOCUMENT],
    undefined,
    { id: MOCK_HERO_MODULE_ID, locale, defaultLocale: EN },
  );

  return heroBlogModuleQuery.parse(raw);
}

describe('heroBlogModuleQuery', () => {
  it.each([
    [
      'picks the eyebrow, action label and image alt in the visitor language',
      NL,
      NL_COPY,
    ],
    [
      'falls back to the default language when the visitor language is missing',
      FR,
      EN_COPY,
    ],
  ])('%s', async (_, locale, copy) => {
    const hero = await runHero(heroDocument, locale);

    expect(hero).toMatchObject({
      eyebrow: copy.eyebrow,
      primaryActionLabel: copy.primaryActionLabel,
      image: { alt: copy.alt },
    });
  });

  it('leaves the eyebrow null when no language has a value', async () => {
    const hero = await runHero({ ...heroDocument, eyebrow: undefined }, NL);

    expect(hero.eyebrow).toBeNull();
  });

  it('fails when the action label is missing in every language', async () => {
    await expect(
      runHero({ ...heroDocument, primaryActionLabel: undefined }, NL),
    ).rejects.toThrow();
  });
});

describe('heroBlogModuleQuery language scoping', () => {
  async function runRaw(module: Record<string, unknown>, locale: string) {
    return (await evaluateGroqExpression(
      heroBlogModuleQuery.query,
      [
        { ...heroDocument, ...module },
        MOCK_IMAGE_ASSET_DOCUMENT,
        ...MOCK_PINNED_POST_DOCUMENTS,
      ],
      undefined,
      { id: MOCK_HERO_MODULE_ID, locale, defaultLocale: EN },
    )) as { post: { _id: string } | null; hasPinnedPost: boolean };
  }

  async function runPost(
    module: Record<string, unknown>,
    locale: string,
  ): Promise<unknown> {
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
    expect(await runPost(pinned(pinnedId), locale)).toBe(expected);
  });

  it('falls back to the newest featured post in the request language', async () => {
    expect(await runPost({}, EN)).toBe(MOCK_ONLY_EN_POST_ID);
    expect(await runPost({}, NL)).toBe(MOCK_DESIGN_NL_POST_ID);
  });

  it.each([
    [
      'as existing when it has no version in the request language',
      pinned(MOCK_ONLY_EN_POST_ID),
      true,
    ],
    [
      'as absent when the reference points at a missing document',
      pinned('deleted-post'),
      false,
    ],
    ['as absent in newest-featured mode', {}, false],
  ])('reports the pinned post %s', async (_, module, expected) => {
    expect((await runRaw(module, NL)).hasPinnedPost).toBe(expected);
  });
});
