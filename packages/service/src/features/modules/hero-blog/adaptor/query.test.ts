import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import { localizedStrings } from '@blog/service/testing/shared/localized';

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
  it('resolves the post with select(), not coalesce(), branching on postSource', () => {
    expect(heroBlogModuleQuery.query).toContain(
      'select( postSource == "PINNED" =>',
    );
    expect(heroBlogModuleQuery.query).not.toContain('coalesce(post->');
  });

  it('falls back to the newest published featured post when postSource is not PINNED', () => {
    expect(heroBlogModuleQuery.query).toContain(
      '*[_type == "page_post"][featured == true][publishedAt <= now()] | order(publishedAt desc)[0]',
    );
  });

  it('projects the post through the shared post-card fragment', () => {
    expect(heroBlogModuleQuery.query).toContain('"slug": slug.current');
    expect(heroBlogModuleQuery.query).toContain('"topic": topic->');
  });

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
