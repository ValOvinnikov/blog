import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { PAGE_LANDING_TYPE } from '@blog/studio/schema-types/documents/pages/landing/landing-type';
import { validateSlugUniqueInLanguage } from '@blog/studio/schema-types/validation/validate-slug-unique-in-language/validate-slug-unique-in-language';
import { evaluate, parse } from 'groq-js';
import type { SlugValidationContext } from 'sanity';

const { EN, NL } = LOCALE_ISO_CODES;

type TPage = { _id: string; language?: string; slug: string };

const page = ({ _id, language, slug }: TPage) => ({
  _id,
  _type: PAGE_LANDING_TYPE,
  slug: { _type: 'slug', current: slug },
  ...(language ? { language } : {}),
});

const createContext = (
  document: ReturnType<typeof page> | undefined,
  dataset: ReturnType<typeof page>[],
  fetchError?: Error,
) => {
  const getClient = () => ({
    withConfig: () => ({
      fetch: async (query: string, params: Record<string, unknown>) => {
        if (fetchError) throw fetchError;
        const result = await evaluate(parse(query), { dataset, params });
        return result.get();
      },
    }),
  });

  return { document, getClient } as unknown as SlugValidationContext;
};

describe(validateSlugUniqueInLanguage, () => {
  const englishAbout = page({ _id: 'about-en', language: EN, slug: 'about' });

  it('allows the same slug in another language', async () => {
    const dutch = page({ _id: 'drafts.about-nl', language: NL, slug: 'about' });

    await expect(
      validateSlugUniqueInLanguage(
        'about',
        createContext(dutch, [englishAbout]),
      ),
    ).resolves.toBe(true);
  });

  it('rejects a slug another page uses in the same language', async () => {
    const other = page({ _id: 'drafts.other', language: EN, slug: 'about' });

    await expect(
      validateSlugUniqueInLanguage(
        'about',
        createContext(other, [englishAbout]),
      ),
    ).resolves.toBe(false);
  });

  it('does not count the draft of the same page as a clash', async () => {
    const draft = page({ _id: 'drafts.about-en', language: EN, slug: 'about' });

    await expect(
      validateSlugUniqueInLanguage(
        'about',
        createContext(draft, [englishAbout]),
      ),
    ).resolves.toBe(true);
  });

  it('treats pages without a language as one language', async () => {
    const legacy = page({ _id: 'legacy', slug: 'contact' });
    const other = page({ _id: 'drafts.other', slug: 'contact' });

    await expect(
      validateSlugUniqueInLanguage('contact', createContext(other, [legacy])),
    ).resolves.toBe(false);
  });

  it('passes when there is no document', async () => {
    await expect(
      validateSlugUniqueInLanguage(
        'about',
        createContext(undefined, [englishAbout]),
      ),
    ).resolves.toBe(true);
  });

  it('passes when the fetch fails', async () => {
    const other = page({ _id: 'other', language: EN, slug: 'about' });

    await expect(
      validateSlugUniqueInLanguage(
        'about',
        createContext(other, [englishAbout], new Error('network down')),
      ),
    ).resolves.toBe(true);
  });
});
