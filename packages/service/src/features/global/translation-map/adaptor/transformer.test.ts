import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';

import { translationMapQuery } from './query';
import {
  findTranslationGroup,
  toTranslationMap,
  type TRawTranslationMap,
} from './transformer';

const { EN, NL, DE } = LOCALE_ISO_CODES;

function page(id: string, language: string, slug?: string) {
  return {
    _id: id,
    _type: 'page_landing',
    language,
    ...(slug ? { slug: { current: slug } } : {}),
  };
}

function metadata(id: string, ...targets: [string, string][]) {
  return {
    _id: id,
    _type: 'translation.metadata',
    translations: targets.map(([language, ref]) => ({
      _key: language,
      language,
      value: { _type: 'reference', _ref: ref },
    })),
  };
}

const dataset = [
  page('about-en', EN, 'about'),
  page('about-nl', NL, 'over-ons'),
  page('about-de', DE, 'ueber-uns'),
  page('pricing-en', EN, 'pricing'),
  page('drafts.pricing-nl', NL, 'prijzen'),
  page('team-en', EN, 'team'),
  page('team-nl', NL),
  metadata('meta-about', [EN, 'about-en'], [NL, 'about-nl'], [DE, 'about-de']),
  metadata('meta-pricing', [EN, 'pricing-en'], [NL, 'pricing-nl']),
  metadata('meta-team', [EN, 'team-en'], [NL, 'team-nl']),
];

function groupWithSlug(
  groups: Awaited<ReturnType<typeof buildMap>>['groups'],
  language: string,
  slug: string,
) {
  return groups.find((group) =>
    group.some(
      (member) => member.language === language && member.slug === slug,
    ),
  );
}

async function buildMap(documents: unknown[]) {
  const raw = await evaluateGroqExpression(
    translationMapQuery.query,
    documents,
    undefined,
  );
  return toTranslationMap(raw as TRawTranslationMap);
}

describe('toTranslationMap', () => {
  it('groups every language of a translated page with its slug', async () => {
    const { groups } = await buildMap(dataset);

    expect(groupWithSlug(groups, EN, 'about')).toEqual([
      { documentType: 'page_landing', language: EN, slug: 'about' },
      { documentType: 'page_landing', language: NL, slug: 'over-ons' },
      { documentType: 'page_landing', language: DE, slug: 'ueber-uns' },
    ]);
  });

  it('drops a translation that exists only as a draft', async () => {
    const { groups } = await buildMap(dataset);

    expect(groupWithSlug(groups, EN, 'pricing')).toEqual([
      { documentType: 'page_landing', language: EN, slug: 'pricing' },
    ]);
  });

  it('drops a published translation that has no slug', async () => {
    const { groups } = await buildMap(dataset);

    expect(groupWithSlug(groups, EN, 'team')).toEqual([
      { documentType: 'page_landing', language: EN, slug: 'team' },
    ]);
  });

  it('is empty for a tenant with no translations', async () => {
    expect(await buildMap([page('about-en', EN, 'about')])).toEqual({
      groups: [],
    });
  });
});

describe('findTranslationGroup', () => {
  it('finds the group from a non-default-language member', async () => {
    const map = await buildMap(dataset);

    expect(
      findTranslationGroup(map, {
        documentType: 'page_landing',
        language: NL,
        slug: 'over-ons',
      }),
    ).toEqual(groupWithSlug(map.groups, EN, 'about'));
  });

  it('is undefined when the slug matches no member', async () => {
    const map = await buildMap(dataset);

    expect(
      findTranslationGroup(map, {
        documentType: 'page_landing',
        language: NL,
        slug: 'about',
      }),
    ).toBeUndefined();
  });

  it('is undefined when the document type differs', async () => {
    const map = await buildMap(dataset);

    expect(
      findTranslationGroup(map, {
        documentType: 'post',
        language: EN,
        slug: 'about',
      }),
    ).toBeUndefined();
  });
});
