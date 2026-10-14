import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { PAGE_LANDING_TYPE } from '@blog/studio/schema-types/documents/pages/landing/landing-type';
import { PAGE_POST_TYPE } from '@blog/studio/schema-types/documents/pages/post/post-type';
import { PAGE_TOPIC_TYPE } from '@blog/studio/schema-types/documents/pages/topic/topic-type';
import { REDIRECT_TYPE } from '@blog/studio/schema-types/documents/redirect/redirect-type';
import {
  AUTOMATIC_REDIRECT_EDITED_WARNING,
  REDIRECT_DESTINATION_UNPUBLISHED_ERROR,
  REDIRECT_SOURCE_SHADOWED_WARNING,
  validateAutomaticRedirectUnchanged,
  validateRedirectDestinationPage,
  validateRedirectSourcePage,
} from '@blog/studio/schema-types/validation/validate-redirect-page/validate-redirect-page';
import { evaluate, parse } from 'groq-js';
import type { SanityDocument, ValidationContext } from 'sanity';

const { EN, NL } = LOCALE_ISO_CODES;

const page = (
  _type: string,
  _id: string,
  slug: string,
  { parent, language = EN }: { parent?: string; language?: string } = {},
) => ({
  _id,
  _type,
  language,
  title: `Title ${_id}`,
  slug: { current: slug },
  ...(parent ? { parent: { _ref: parent } } : {}),
});

const redirect = (
  _id: string,
  fields: Record<string, unknown> = {},
): SanityDocument =>
  ({
    _id,
    _type: REDIRECT_TYPE,
    language: EN,
    source: '/old',
    destination: '/new',
    ...fields,
  }) as unknown as SanityDocument;

const createContext = (
  document: SanityDocument,
  dataset: unknown[],
  fetchError?: Error,
) =>
  ({
    document,
    getClient: () => ({
      withConfig: () => ({
        fetch: async (query: string, params: Record<string, unknown>) => {
          if (fetchError) throw fetchError;
          return (await evaluate(parse(query), { dataset, params })).get();
        },
      }),
    }),
  }) as unknown as ValidationContext;

const PAGES = [
  page(PAGE_LANDING_TYPE, 'services', 'services'),
  page(PAGE_LANDING_TYPE, 'design', 'design', { parent: 'services' }),
  page(PAGE_LANDING_TYPE, 'design-nl', 'design', { language: NL }),
  page(PAGE_POST_TYPE, 'hello', 'hello'),
  page(PAGE_TOPIC_TYPE, 'news', 'news'),
];

describe(validateRedirectDestinationPage, () => {
  const document = redirect('drafts.r1');

  it.each([
    '/services',
    '/services/design',
    '/blog/hello',
    '/topics/news',
    '/topics/news/page/2',
    '/',
    '/blog',
    '/blog/page/3',
    '/account',
  ])('passes %s, where a page is live', async (path) => {
    await expect(
      validateRedirectDestinationPage(path, createContext(document, PAGES)),
    ).resolves.toBe(true);
  });

  it.each([
    '/missing',
    '/design',
    '/services/missing',
    '/blog/missing',
    '/blog/hello/extra',
    '/tags/news',
  ])('blocks %s, where no page is published', async (path) => {
    await expect(
      validateRedirectDestinationPage(path, createContext(document, PAGES)),
    ).resolves.toBe(REDIRECT_DESTINATION_UNPUBLISHED_ERROR);
  });

  it('blocks a page that is only published in another language', async () => {
    const dataset = [
      page(PAGE_LANDING_TYPE, 'about-nl', 'about', { language: NL }),
    ];

    await expect(
      validateRedirectDestinationPage(
        '/about',
        createContext(document, dataset),
      ),
    ).resolves.toBe(REDIRECT_DESTINATION_UNPUBLISHED_ERROR);
  });

  it('passes when the page lookup fails', async () => {
    await expect(
      validateRedirectDestinationPage(
        '/missing',
        createContext(document, PAGES, new Error('network')),
      ),
    ).resolves.toBe(true);
  });
});

describe(validateRedirectSourcePage, () => {
  const document = redirect('drafts.r1');

  it('warns when a page is published at the source', async () => {
    await expect(
      validateRedirectSourcePage(
        '/services/design',
        createContext(document, PAGES),
      ),
    ).resolves.toBe(REDIRECT_SOURCE_SHADOWED_WARNING);
  });

  it('passes a source with no published page', async () => {
    await expect(
      validateRedirectSourcePage('/old-design', createContext(document, PAGES)),
    ).resolves.toBe(true);
  });

  it('passes when the page lookup fails', async () => {
    await expect(
      validateRedirectSourcePage(
        '/services',
        createContext(document, PAGES, new Error('network')),
      ),
    ).resolves.toBe(true);
  });
});

describe(validateAutomaticRedirectUnchanged, () => {
  const published = redirect('r1', { isAutomatic: true });

  it('warns when the source of an automatic redirect is changed', async () => {
    const draft = redirect('drafts.r1', {
      isAutomatic: true,
      source: '/older',
    });

    await expect(
      validateAutomaticRedirectUnchanged('source')(
        '/older',
        createContext(draft, [published]),
      ),
    ).resolves.toBe(AUTOMATIC_REDIRECT_EDITED_WARNING);
  });

  it('warns when the destination of an automatic redirect is changed', async () => {
    const draft = redirect('drafts.r1', {
      isAutomatic: true,
      destination: '/elsewhere',
    });

    await expect(
      validateAutomaticRedirectUnchanged('destination')(
        '/elsewhere',
        createContext(draft, [published]),
      ),
    ).resolves.toBe(AUTOMATIC_REDIRECT_EDITED_WARNING);
  });

  it('passes an automatic redirect left as it was created', async () => {
    const draft = redirect('drafts.r1', { isAutomatic: true });

    await expect(
      validateAutomaticRedirectUnchanged('source')(
        '/old',
        createContext(draft, [published]),
      ),
    ).resolves.toBe(true);
  });

  it('passes a changed manual redirect', async () => {
    const draft = redirect('drafts.r1', { source: '/older' });

    await expect(
      validateAutomaticRedirectUnchanged('source')(
        '/older',
        createContext(draft, [redirect('r1')]),
      ),
    ).resolves.toBe(true);
  });
});
