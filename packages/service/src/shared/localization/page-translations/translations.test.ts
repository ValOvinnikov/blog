import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';

import { translationsQuery } from './translations';

const { EN, NL } = LOCALE_ISO_CODES;

function page(id: string, language: string, slug?: string) {
  return {
    _id: id,
    _type: 'page_landing',
    language,
    ...(slug ? { slug: { current: slug } } : {}),
  };
}

function translation(id: string, language: string) {
  return {
    _key: language,
    language,
    value: { _type: 'reference', _ref: id },
  };
}

const aboutEn = page('about-en', EN, 'about');
const aboutNl = page('about-nl', NL, 'over-ons');
const contact = page('contact', EN, 'contact');
const pricing = page('pricing-en', EN, 'pricing');
const draftOnlyPricingNl = page('drafts.pricing-nl', NL, 'prijzen');
const team = page('team-en', EN, 'team');
const slugless = page('team-nl', NL);
const modulesEn = page('modules-en', EN, 'modules');
const modulesNl = page('modules-nl', NL, 'modules');
const faqEn = {
  ...page('faq-en', EN, 'faq'),
  parent: { _type: 'reference', _ref: 'modules-en' },
};
const faqNl = {
  ...page('faq-nl', NL, 'vragen'),
  parent: { _type: 'reference', _ref: 'modules-nl' },
};

const dataset = [
  aboutEn,
  aboutNl,
  contact,
  pricing,
  draftOnlyPricingNl,
  team,
  slugless,
  modulesEn,
  modulesNl,
  faqEn,
  faqNl,
  {
    _id: 'meta-faq',
    _type: 'translation.metadata',
    translations: [translation('faq-en', EN), translation('faq-nl', NL)],
  },
  {
    _id: 'meta-about',
    _type: 'translation.metadata',
    translations: [translation('about-en', EN), translation('about-nl', NL)],
  },
  {
    _id: 'meta-pricing',
    _type: 'translation.metadata',
    translations: [
      translation('pricing-en', EN),
      translation('pricing-nl', NL),
    ],
  },
  {
    _id: 'meta-team',
    _type: 'translation.metadata',
    translations: [translation('team-en', EN), translation('team-nl', NL)],
  },
];

function resolve(root: { _id: string }): Promise<unknown> {
  return evaluateGroqExpression(
    `*[_id == $id][0]{ "translations": ${translationsQuery.query} }.translations`,
    dataset,
    undefined,
    { id: root._id },
  );
}

describe('translationsQuery', () => {
  it('lists every translation, the page itself included', async () => {
    expect(await resolve(aboutEn)).toEqual([
      { language: EN, slug: 'about' },
      { language: NL, slug: 'over-ons' },
    ]);
  });

  it('lists the same set from a translation', async () => {
    expect(await resolve(aboutNl)).toEqual([
      { language: EN, slug: 'about' },
      { language: NL, slug: 'over-ons' },
    ]);
  });

  it('is null when the page has no translation metadata', async () => {
    expect(await resolve(contact)).toBeNull();
  });

  it('skips a translation that is not published', async () => {
    expect(await resolve(pricing)).toEqual([{ language: EN, slug: 'pricing' }]);
  });

  it('skips a published translation that has no slug', async () => {
    expect(await resolve(team)).toEqual([{ language: EN, slug: 'team' }]);
  });

  it('lists a nested page by its full path in each language', async () => {
    expect(await resolve(faqEn)).toEqual([
      { language: EN, slug: 'modules/faq' },
      { language: NL, slug: 'modules/vragen' },
    ]);
  });
});
