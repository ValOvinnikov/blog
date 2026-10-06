import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { applyLandingRedirects } from '@blog/studio/document-actions/apply-landing-redirects/apply-landing-redirects';
import { PAGE_LANDING_TYPE } from '@blog/studio/schema-types/documents/pages/landing/landing-type';
import { REDIRECT_TYPE } from '@blog/studio/schema-types/documents/redirect/redirect-type';
import { evaluate, parse } from 'groq-js';
import type { SanityClient } from 'sanity';

const { EN, NL } = LOCALE_ISO_CODES;

const page = (
  _id: string,
  slug: string,
  parent?: string,
  language: string = EN,
) => ({
  _id,
  _type: PAGE_LANDING_TYPE,
  language,
  slug: { _type: 'slug', current: slug },
  ...(parent ? { parent: { _type: 'reference', _ref: parent } } : {}),
});

const redirect = (
  _id: string,
  source: string,
  destination: string,
  language: string = EN,
) => ({ _id, _type: REDIRECT_TYPE, language, source, destination });

const createClient = (dataset: unknown[]) => {
  const operations: unknown[] = [];
  const transaction = {
    delete: (id: string) => {
      operations.push({ delete: id });
      return transaction;
    },
    patch: (
      id: string,
      build: (patch: { set: (value: unknown) => unknown }) => unknown,
    ) => {
      build({ set: (value) => operations.push({ patch: id, set: value }) });
      return transaction;
    },
    create: (document: unknown) => {
      operations.push({ create: document });
      return transaction;
    },
    commit: async () => {
      operations.push('commit');
    },
  };
  const client = {
    fetch: async (query: string, params: Record<string, unknown>) =>
      (await evaluate(parse(query), { dataset, params })).get(),
    transaction: () => transaction,
  } as unknown as Pick<SanityClient, 'fetch' | 'transaction'>;

  return { client, operations };
};

describe(applyLandingRedirects, () => {
  it('redirects a renamed page from its old path', async () => {
    const { client, operations } = createClient([page('faq', 'faq')]);

    await applyLandingRedirects(client, page('drafts.faq', 'questions'));

    expect(operations).toEqual([
      {
        create: {
          _type: REDIRECT_TYPE,
          language: EN,
          source: '/faq',
          destination: '/questions',
          isPrefix: false,
        },
      },
      'commit',
    ]);
  });

  it('redirects a re-parented page to its path under the new parent', async () => {
    const { client, operations } = createClient([
      page('help', 'help'),
      page('faq', 'faq'),
    ]);

    await applyLandingRedirects(client, page('drafts.faq', 'faq', 'help'));

    expect(operations).toContainEqual({
      create: expect.objectContaining({
        source: '/faq',
        destination: '/help/faq',
        isPrefix: false,
      }),
    });
  });

  it('makes a prefix redirect when a renamed parent has sub-pages', async () => {
    const { client, operations } = createClient([
      page('modules', 'modules'),
      page('faq', 'faq', 'modules'),
      page('pricing', 'pricing', 'modules'),
    ]);

    await applyLandingRedirects(client, page('drafts.modules', 'catalog'));

    expect(operations).toEqual([
      {
        create: expect.objectContaining({
          source: '/modules',
          destination: '/catalog',
          isPrefix: true,
        }),
      },
      'commit',
    ]);
  });

  it('collapses and clears existing redirects in the same language only', async () => {
    const { client, operations } = createClient([
      page('faq', 'faq', 'help'),
      page('help', 'help'),
      redirect('r1', '/questions', '/help/faq'),
      redirect('r2', '/faq', '/help/faq'),
      redirect('r3', '/questions', '/help/faq', NL),
    ]);

    await applyLandingRedirects(client, page('drafts.faq', 'faq'));

    expect(operations).toEqual([
      { delete: 'r2' },
      { patch: 'r1', set: { destination: '/faq' } },
      {
        create: expect.objectContaining({
          source: '/help/faq',
          destination: '/faq',
        }),
      },
      'commit',
    ]);
  });

  it('writes nothing on a first publish', async () => {
    const { client, operations } = createClient([]);

    await applyLandingRedirects(client, page('drafts.faq', 'faq'));

    expect(operations).toEqual([]);
  });

  it('writes nothing when the path is unchanged', async () => {
    const { client, operations } = createClient([page('faq', 'faq')]);

    await applyLandingRedirects(client, page('drafts.faq', 'faq'));

    expect(operations).toEqual([]);
  });
});
