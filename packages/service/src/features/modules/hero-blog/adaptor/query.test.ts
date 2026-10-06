import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import { localizedStrings } from '@blog/service/testing/shared/localized';
import { translatedPostDocuments } from '@blog/service/testing/shared/translated-posts-dataset';

import { heroBlogModuleQuery } from './query';

const { EN, NL, FR } = LOCALE_ISO_CODES;

const heroDocument = {
  _id: 'hero-1',
  _type: 'module_heroBlog',
  brandVariant: 'PRIMARY',
  variant: 'SPLIT',
  postSource: 'NEWEST_FEATURED',
  primaryActionAppearance: 'CONTAINED',
  eyebrow: localizedStrings({ [EN]: 'Featured', [NL]: 'Uitgelicht' }),
  primaryActionLabel: localizedStrings({
    [EN]: 'Read the post',
    [NL]: 'Lees het bericht',
  }),
  image: {
    _type: 'localizedImageWithAlt',
    asset: { _type: 'reference', _ref: 'image-1' },
    alt: localizedStrings({ [EN]: 'A desk', [NL]: 'Een bureau' }),
  },
};

const imageAsset = { _id: 'image-1', _type: 'sanity.imageAsset' };

async function runHero(document: Record<string, unknown>, locale: string) {
  const raw = await evaluateGroqExpression(
    heroBlogModuleQuery.query,
    [document, imageAsset],
    undefined,
    { id: 'hero-1', locale, defaultLocale: EN },
  );

  return heroBlogModuleQuery.parse(raw);
}

describe('heroBlogModuleQuery', () => {
  it('picks the eyebrow, action label and image alt in the visitor language', async () => {
    const hero = await runHero(heroDocument, NL);

    expect(hero).toMatchObject({
      eyebrow: 'Uitgelicht',
      primaryActionLabel: 'Lees het bericht',
      image: { alt: 'Een bureau' },
    });
  });

  it('falls back to the default language when the visitor language is missing', async () => {
    const hero = await runHero(heroDocument, FR);

    expect(hero).toMatchObject({
      eyebrow: 'Featured',
      primaryActionLabel: 'Read the post',
      image: { alt: 'A desk' },
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
  async function runPost(
    module: Record<string, unknown>,
    locale: string,
  ): Promise<unknown> {
    const raw = (await evaluateGroqExpression(
      heroBlogModuleQuery.query,
      [{ ...heroDocument, ...module }, imageAsset, ...translatedPostDocuments],
      undefined,
      { id: 'hero-1', locale, defaultLocale: EN },
    )) as { post: { _id: string } | null };

    return raw.post?._id ?? null;
  }

  function pinned(id: string) {
    return { postSource: 'PINNED', post: { _type: 'reference', _ref: id } };
  }

  it('shows the pinned post in its own language', async () => {
    expect(await runPost(pinned('design-en'), EN)).toBe('design-en');
  });

  it('swaps the pinned post for its translation', async () => {
    expect(await runPost(pinned('design-en'), NL)).toBe('design-nl');
  });

  it('shows no post when the pinned one has no translation', async () => {
    expect(await runPost(pinned('only-en'), NL)).toBeNull();
  });

  it('falls back to the newest featured post in the request language', async () => {
    expect(await runPost({}, EN)).toBe('only-en');
    expect(await runPost({}, NL)).toBe('design-nl');
  });
});
