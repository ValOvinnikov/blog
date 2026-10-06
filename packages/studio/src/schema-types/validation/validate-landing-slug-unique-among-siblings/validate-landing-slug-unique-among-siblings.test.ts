import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { PAGE_LANDING_TYPE } from '@blog/studio/schema-types/documents/pages/landing/landing-type';
import { validateLandingSlugUniqueAmongSiblings } from '@blog/studio/schema-types/validation/validate-landing-slug-unique-among-siblings/validate-landing-slug-unique-among-siblings';
import { evaluate, parse } from 'groq-js';
import type { SlugValidationContext } from 'sanity';

const { EN, NL } = LOCALE_ISO_CODES;

type TPage = { _id: string; slug: string; parent?: string; language?: string };

const page = ({ _id, slug, parent, language = EN }: TPage) => ({
  _id,
  _type: PAGE_LANDING_TYPE,
  language,
  slug: { _type: 'slug', current: slug },
  ...(parent ? { parent: { _type: 'reference', _ref: parent } } : {}),
});

const createContext = (
  document: ReturnType<typeof page> | undefined,
  dataset: ReturnType<typeof page>[],
  fetchError?: Error,
) =>
  ({
    document,
    getClient: () => ({
      withConfig: () => ({
        fetch: async (query: string, params: Record<string, unknown>) => {
          if (fetchError) throw fetchError;
          const result = await evaluate(parse(query), { dataset, params });
          return result.get();
        },
      }),
    }),
  }) as unknown as SlugValidationContext;

describe(validateLandingSlugUniqueAmongSiblings, () => {
  const modules = page({ _id: 'modules', slug: 'modules' });
  const help = page({ _id: 'help', slug: 'help' });
  const modulesFaq = page({
    _id: 'modules-faq',
    slug: 'faq',
    parent: 'modules',
  });

  it('allows the same slug under a different parent', async () => {
    const helpFaq = page({
      _id: 'drafts.help-faq',
      slug: 'faq',
      parent: 'help',
    });

    await expect(
      validateLandingSlugUniqueAmongSiblings(
        'faq',
        createContext(helpFaq, [modules, help, modulesFaq]),
      ),
    ).resolves.toBe(true);
  });

  it('rejects a slug a sibling uses under the same parent', async () => {
    const other = page({ _id: 'drafts.other', slug: 'faq', parent: 'modules' });

    await expect(
      validateLandingSlugUniqueAmongSiblings(
        'faq',
        createContext(other, [modules, modulesFaq]),
      ),
    ).resolves.toBe(false);
  });

  it('rejects a slug another top-level page uses', async () => {
    const other = page({ _id: 'drafts.other', slug: 'modules' });

    await expect(
      validateLandingSlugUniqueAmongSiblings(
        'modules',
        createContext(other, [modules]),
      ),
    ).resolves.toBe(false);
  });

  it('allows a top-level slug that a nested page uses', async () => {
    const topLevelFaq = page({ _id: 'drafts.faq', slug: 'faq' });

    await expect(
      validateLandingSlugUniqueAmongSiblings(
        'faq',
        createContext(topLevelFaq, [modules, modulesFaq]),
      ),
    ).resolves.toBe(true);
  });

  it('allows the same slug under the same parent in another language', async () => {
    const dutch = page({
      _id: 'drafts.faq-nl',
      slug: 'faq',
      parent: 'modules',
      language: NL,
    });

    await expect(
      validateLandingSlugUniqueAmongSiblings(
        'faq',
        createContext(dutch, [modules, modulesFaq]),
      ),
    ).resolves.toBe(true);
  });

  it('does not count the draft of the same page as a clash', async () => {
    const draft = page({
      _id: 'drafts.modules-faq',
      slug: 'faq',
      parent: 'modules',
    });

    await expect(
      validateLandingSlugUniqueAmongSiblings(
        'faq',
        createContext(draft, [modules, modulesFaq]),
      ),
    ).resolves.toBe(true);
  });

  it('passes when there is no document', async () => {
    await expect(
      validateLandingSlugUniqueAmongSiblings(
        'faq',
        createContext(undefined, [modulesFaq]),
      ),
    ).resolves.toBe(true);
  });

  it('passes when the fetch fails', async () => {
    const other = page({ _id: 'other', slug: 'faq', parent: 'modules' });

    await expect(
      validateLandingSlugUniqueAmongSiblings(
        'faq',
        createContext(other, [modulesFaq], new Error('network down')),
      ),
    ).resolves.toBe(true);
  });
});
