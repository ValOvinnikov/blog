import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { PAGE_LANDING_TYPE } from '@blog/studio/schema-types/documents/pages/landing/landing-type';
import { onePagePerTranslationGroupFilter } from '@blog/studio/schema-types/filters/one-page-per-translation-group';
import { setDefaultLanguage } from '@blog/studio/schema-types/validation/default-language/default-language';
import { evaluate, parse } from 'groq-js';

const { EN, NL, FR } = LOCALE_ISO_CODES;

const page = (_id: string, language?: string) => ({
  _id,
  _type: PAGE_LANDING_TYPE,
  ...(language && { language }),
});

const translationGroup = (...members: [id: string, language: string][]) => ({
  _id: `translation.metadata.${members.map(([id]) => id).join('-')}`,
  _type: 'translation.metadata',
  translations: members.map(([id, language]) => ({
    _key: language,
    language,
    value: { _ref: id, _weak: true },
  })),
});

const offeredPages = async (dataset: Record<string, unknown>[]) => {
  const { filter, params } = onePagePerTranslationGroupFilter();
  const query = `*[_type == $type && ${filter}] | order(_id asc)._id`;
  const queryParams = { ...params, type: PAGE_LANDING_TYPE };
  const result = await evaluate(parse(query, { params: queryParams }), {
    dataset,
    params: queryParams,
  });

  return result.get();
};

describe(onePagePerTranslationGroupFilter, () => {
  afterEach(() => {
    setDefaultLanguage(EN);
  });

  it('offers a page translated into two languages once, as its default-language document', async () => {
    await expect(
      offeredPages([
        page('modules-en', EN),
        page('modules-nl', NL),
        translationGroup(['modules-en', EN], ['modules-nl', NL]),
      ]),
    ).resolves.toEqual(['modules-en']);
  });

  it('offers a page that exists in one non-default language once', async () => {
    await expect(offeredPages([page('about-nl', NL)])).resolves.toEqual([
      'about-nl',
    ]);
  });

  it('offers a translated page with no default-language document once', async () => {
    await expect(
      offeredPages([
        page('pricing-nl', NL),
        page('pricing-fr', FR),
        translationGroup(['pricing-nl', NL], ['pricing-fr', FR]),
      ]),
    ).resolves.toEqual(['pricing-nl']);
  });

  it('passes over a deleted default-language document still named in the group', async () => {
    await expect(
      offeredPages([
        page('team-nl', NL),
        translationGroup(['team-en', EN], ['team-nl', NL]),
      ]),
    ).resolves.toEqual(['team-nl']);
  });

  it('hides the draft of a non-default translation along with its published version', async () => {
    await expect(
      offeredPages([
        page('modules-en', EN),
        page('modules-nl', NL),
        page('drafts.modules-nl', NL),
        translationGroup(['modules-en', EN], ['modules-nl', NL]),
      ]),
    ).resolves.toEqual(['modules-en']);
  });

  it('treats a page without a language as the default language', async () => {
    await expect(offeredPages([page('legacy')])).resolves.toEqual(['legacy']);
  });

  it('follows the site default language', async () => {
    setDefaultLanguage(NL);

    await expect(
      offeredPages([
        page('modules-en', EN),
        page('modules-nl', NL),
        translationGroup(['modules-en', EN], ['modules-nl', NL]),
      ]),
    ).resolves.toEqual(['modules-nl']);
  });
});
