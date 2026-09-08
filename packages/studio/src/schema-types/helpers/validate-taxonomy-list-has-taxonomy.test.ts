import { validateTaxonomyListHasTaxonomy } from '@blog/studio/schema-types/helpers/validate-taxonomy-list-has-taxonomy';
import { taxonomyListSchema } from '@blog/studio/schema-types/modules/module-taxonomy-list';
import type { ValidationContext } from 'sanity';

type TModuleReference = { _type?: string; _ref?: string };
type TCandidate = {
  id: string;
  title?: string | null;
  taxonomy?: string | null;
};

const createMockContext = (candidates: TCandidate[]) => {
  const fetchCalls: { query: string; params: unknown }[] = [];

  const context = {
    getClient: () => ({
      withConfig: () => ({
        fetch: async (query: string, params: unknown) => {
          fetchCalls.push({ query, params });
          return candidates;
        },
      }),
    }),
  } as unknown as ValidationContext;

  return { context, fetchCalls };
};

describe('validateTaxonomyListHasTaxonomy', () => {
  it('passes with no modules', async () => {
    const { context } = createMockContext([]);

    await expect(
      validateTaxonomyListHasTaxonomy(undefined, context),
    ).resolves.toBe(true);
  });

  it('ignores modules of other types', async () => {
    const { context, fetchCalls } = createMockContext([]);
    const modules: TModuleReference[] = [
      { _type: 'module_cta', _ref: 'cta-1' },
    ];

    await expect(
      validateTaxonomyListHasTaxonomy(modules, context),
    ).resolves.toBe(true);
    expect(fetchCalls).toHaveLength(0);
  });

  it('passes when the referenced taxonomyList module has a taxonomy', async () => {
    const { context } = createMockContext([
      { id: 'taxonomy-list-1', title: 'Browse Topics', taxonomy: 'TOPICS' },
    ]);
    const modules: TModuleReference[] = [
      { _type: taxonomyListSchema.name, _ref: 'taxonomy-list-1' },
    ];

    await expect(
      validateTaxonomyListHasTaxonomy(modules, context),
    ).resolves.toBe(true);
  });

  it('fails with the interpolated title when the taxonomy is unset', async () => {
    const { context } = createMockContext([
      { id: 'taxonomy-list-1', title: 'Browse Topics', taxonomy: undefined },
    ]);
    const modules: TModuleReference[] = [
      { _type: taxonomyListSchema.name, _ref: 'taxonomy-list-1' },
    ];

    await expect(
      validateTaxonomyListHasTaxonomy(modules, context),
    ).resolves.toBe(
      "Choose whether the 'Browse Topics' module lists topics or tags.",
    );
  });

  it('falls back to "Untitled" when the module has no title', async () => {
    const { context } = createMockContext([
      { id: 'taxonomy-list-1', taxonomy: undefined },
    ]);
    const modules: TModuleReference[] = [
      { _type: taxonomyListSchema.name, _ref: 'taxonomy-list-1' },
    ];

    await expect(
      validateTaxonomyListHasTaxonomy(modules, context),
    ).resolves.toBe(
      "Choose whether the 'Untitled' module lists topics or tags.",
    );
  });

  it('only queries referenced taxonomyList modules', async () => {
    const { context, fetchCalls } = createMockContext([
      { id: 'taxonomy-list-1', title: 'Browse Topics', taxonomy: 'TOPICS' },
    ]);
    const modules: TModuleReference[] = [
      { _type: taxonomyListSchema.name, _ref: 'taxonomy-list-1' },
      { _type: 'module_cta', _ref: 'cta-1' },
    ];

    await validateTaxonomyListHasTaxonomy(modules, context);

    expect(fetchCalls[0]?.params).toEqual({ ids: ['taxonomy-list-1'] });
  });
});
