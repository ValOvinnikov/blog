import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { PAGE_HOME_TYPE } from '@blog/studio/schema-types/documents/pages/home/home-type';
import { setDefaultLanguage } from '@blog/studio/schema-types/validation/default-language/default-language';
import { validateOnePerLanguage } from '@blog/studio/schema-types/validation/validate-one-per-language/validate-one-per-language';
import { evaluate, parse } from 'groq-js';
import type { SanityDocument, ValidationContext } from 'sanity';

const { EN, NL } = LOCALE_ISO_CODES;

const home = (_id: string, language?: string) =>
  ({
    _id,
    _type: PAGE_HOME_TYPE,
    ...(language ? { language } : {}),
  }) as unknown as SanityDocument;

const createContext = (dataset: SanityDocument[], fetchError?: Error) =>
  ({
    type: { title: 'Home Page' },
    getClient: () => ({
      withConfig: () => ({
        fetch: async (query: string, params: Record<string, unknown>) => {
          if (fetchError) throw fetchError;
          const result = await evaluate(parse(query), { dataset, params });
          return result.get();
        },
      }),
    }),
  }) as unknown as ValidationContext;

const DUPLICATE_DUTCH = "There's already a Home Page in Dutch.";
const DUPLICATE_ENGLISH = "There's already a Home Page in English.";

describe(validateOnePerLanguage, () => {
  const englishHome = home('page_home', EN);

  afterEach(() => {
    setDefaultLanguage(EN);
  });

  it('allows a Home in another language', async () => {
    await expect(
      validateOnePerLanguage(
        home('drafts.home-nl', NL),
        createContext([englishHome]),
      ),
    ).resolves.toBe(true);
  });

  it('rejects a second Home in the same language', async () => {
    await expect(
      validateOnePerLanguage(
        home('drafts.home-nl', NL),
        createContext([englishHome, home('home-nl-first', NL)]),
      ),
    ).resolves.toBe(DUPLICATE_DUTCH);
  });

  it('does not count the draft of the same Home as a second one', async () => {
    await expect(
      validateOnePerLanguage(
        home('drafts.page_home', EN),
        createContext([englishHome]),
      ),
    ).resolves.toBe(true);
  });

  it('counts a Home without a language as the default language', async () => {
    await expect(
      validateOnePerLanguage(
        home('drafts.home-en', EN),
        createContext([home('page_home')]),
      ),
    ).resolves.toBe(DUPLICATE_ENGLISH);
  });

  it('follows the default language when it is not English', async () => {
    setDefaultLanguage(NL);

    await expect(
      validateOnePerLanguage(
        home('drafts.home-nl', NL),
        createContext([home('page_home')]),
      ),
    ).resolves.toBe(DUPLICATE_DUTCH);
  });

  it('passes when there is no document', async () => {
    await expect(
      validateOnePerLanguage(undefined, createContext([englishHome])),
    ).resolves.toBe(true);
  });

  it('passes when the fetch fails', async () => {
    await expect(
      validateOnePerLanguage(
        home('home-en', EN),
        createContext([englishHome], new Error('network down')),
      ),
    ).resolves.toBe(true);
  });
});
