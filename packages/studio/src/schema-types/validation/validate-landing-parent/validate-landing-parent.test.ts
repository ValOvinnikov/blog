import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { PAGE_LANDING_TYPE } from '@blog/studio/schema-types/documents/pages/landing/landing-type';
import {
  LANDING_PARENT_CYCLE_ERROR,
  LANDING_PARENT_DEPTH_ERROR,
  LANDING_PARENT_LANGUAGE_ERROR,
  validateLandingParent,
} from '@blog/studio/schema-types/validation/validate-landing-parent/validate-landing-parent';
import { evaluate, parse } from 'groq-js';
import type { Reference, SanityDocument, ValidationContext } from 'sanity';

const { EN, NL } = LOCALE_ISO_CODES;

const ref = (id: string): Reference => ({ _type: 'reference', _ref: id });

const page = (_id: string, parent?: string, language: string = EN) =>
  ({
    _id,
    _type: PAGE_LANDING_TYPE,
    language,
    slug: { _type: 'slug', current: _id },
    ...(parent ? { parent: ref(parent) } : {}),
  }) as unknown as SanityDocument;

const createContext = (
  document: SanityDocument | undefined,
  dataset: unknown[],
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
  }) as unknown as ValidationContext;

describe(validateLandingParent, () => {
  const modules = page('modules');
  const faq = page('faq', 'modules');
  let draft: SanityDocument;

  beforeEach(() => {
    draft = page('drafts.modules');
  });

  it('passes a page with no parent', async () => {
    await expect(
      validateLandingParent(undefined, createContext(page('team'), [modules])),
    ).resolves.toBe(true);
  });

  it('passes a parent in the same language within the depth bound', async () => {
    const team = page('drafts.team');

    await expect(
      validateLandingParent(ref('modules'), createContext(team, [modules])),
    ).resolves.toBe(true);
  });

  it('rejects the page as its own parent', async () => {
    await expect(
      validateLandingParent(ref('modules'), createContext(draft, [modules])),
    ).resolves.toBe(LANDING_PARENT_CYCLE_ERROR);
  });

  it('rejects a parent that sits beneath the page', async () => {
    await expect(
      validateLandingParent(ref('faq'), createContext(draft, [modules, faq])),
    ).resolves.toBe(LANDING_PARENT_CYCLE_ERROR);
  });

  it('rejects a parent in another language', async () => {
    const dutch = page('drafts.over', undefined, NL);

    await expect(
      validateLandingParent(ref('modules'), createContext(dutch, [modules])),
    ).resolves.toBe(LANDING_PARENT_LANGUAGE_ERROR);
  });

  it('rejects nesting the page deeper than the bound', async () => {
    const billing = page('billing', 'faq');
    const invoices = page('drafts.invoices');

    await expect(
      validateLandingParent(
        ref('billing'),
        createContext(invoices, [modules, faq, billing]),
      ),
    ).resolves.toBe(LANDING_PARENT_DEPTH_ERROR);
  });

  it('rejects a move that pushes the page’s own sub-pages past the bound', async () => {
    const pricing = page('drafts.pricing');
    const plans = page('plans', 'pricing');

    await expect(
      validateLandingParent(
        ref('faq'),
        createContext(pricing, [modules, faq, plans]),
      ),
    ).resolves.toBe(LANDING_PARENT_DEPTH_ERROR);
  });

  it('passes when the parent no longer exists', async () => {
    await expect(
      validateLandingParent(ref('gone'), createContext(page('team'), [])),
    ).resolves.toBe(true);
  });

  it('passes when the fetch fails', async () => {
    await expect(
      validateLandingParent(
        ref('modules'),
        createContext(page('team'), [modules], new Error('network down')),
      ),
    ).resolves.toBe(true);
  });
});
