import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { REDIRECT_TYPE } from '@blog/studio/schema-types/documents/redirect/redirect-type';
import {
  REDIRECT_DUPLICATE_SOURCE_ERROR,
  REDIRECT_INCOMING_CHAIN_ERROR,
  REDIRECT_OUTGOING_CHAIN_ERROR,
  validateRedirectDestination,
  validateRedirectSource,
} from '@blog/studio/schema-types/validation/validate-redirect-chain/validate-redirect-chain';
import { evaluate, parse } from 'groq-js';
import type { SanityDocument, ValidationContext } from 'sanity';

const { EN, NL } = LOCALE_ISO_CODES;

const redirect = (
  _id: string,
  source: string,
  destination: string,
  {
    isPrefix = false,
    language = EN,
  }: { isPrefix?: boolean; language?: string } = {},
) =>
  ({
    _id,
    _type: REDIRECT_TYPE,
    language,
    source,
    destination,
    isPrefix,
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

describe(validateRedirectSource, () => {
  let draft: SanityDocument;

  beforeEach(() => {
    draft = redirect('drafts.r1', '/faq', '/help');
  });

  it('passes a source no other redirect uses', async () => {
    await expect(
      validateRedirectSource('/faq', createContext(draft, [draft])),
    ).resolves.toBe(true);
  });

  it('rejects a source another redirect already starts from', async () => {
    await expect(
      validateRedirectSource(
        '/faq',
        createContext(draft, [redirect('r2', '/faq', '/other')]),
      ),
    ).resolves.toBe(REDIRECT_DUPLICATE_SOURCE_ERROR);
  });

  it('rejects a source another redirect sends visitors to', async () => {
    await expect(
      validateRedirectSource(
        '/faq',
        createContext(draft, [redirect('r2', '/questions', '/faq')]),
      ),
    ).resolves.toBe(REDIRECT_INCOMING_CHAIN_ERROR);
  });

  it('rejects a prefix source another redirect sends visitors beneath', async () => {
    const prefixDraft = redirect('drafts.r1', '/modules', '/catalog', {
      isPrefix: true,
    });

    await expect(
      validateRedirectSource(
        '/modules',
        createContext(prefixDraft, [redirect('r2', '/old', '/modules/faq')]),
      ),
    ).resolves.toBe(REDIRECT_INCOMING_CHAIN_ERROR);
  });

  it('ignores redirects in another language', async () => {
    await expect(
      validateRedirectSource(
        '/faq',
        createContext(draft, [redirect('r2', '/faq', '/x', { language: NL })]),
      ),
    ).resolves.toBe(true);
  });

  it('passes when the lookup fails', async () => {
    await expect(
      validateRedirectSource('/faq', createContext(draft, [], new Error('x'))),
    ).resolves.toBe(true);
  });
});

describe(validateRedirectDestination, () => {
  let draft: SanityDocument;

  beforeEach(() => {
    draft = redirect('drafts.r1', '/faq', '/help');
  });

  it('passes a destination that is not redirected', async () => {
    await expect(
      validateRedirectDestination('/help', createContext(draft, [])),
    ).resolves.toBe(true);
  });

  it('rejects a destination that is itself redirected', async () => {
    await expect(
      validateRedirectDestination(
        '/help',
        createContext(draft, [redirect('r2', '/help', '/support')]),
      ),
    ).resolves.toBe(REDIRECT_OUTGOING_CHAIN_ERROR);
  });

  it('rejects a destination beneath a prefix redirect', async () => {
    const nestedDraft = redirect('drafts.r1', '/faq', '/modules/faq');

    await expect(
      validateRedirectDestination(
        '/modules/faq',
        createContext(nestedDraft, [
          redirect('r2', '/modules', '/catalog', { isPrefix: true }),
        ]),
      ),
    ).resolves.toBe(REDIRECT_OUTGOING_CHAIN_ERROR);
  });
});
