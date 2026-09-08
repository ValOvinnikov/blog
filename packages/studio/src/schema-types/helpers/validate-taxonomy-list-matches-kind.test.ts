import { TAXONOMY_KIND } from '@blog/config/constants';
import { validateTaxonomyListMatchesKind } from '@blog/studio/schema-types/helpers/validate-taxonomy-list-matches-kind';
import type { ValidationContext } from 'sanity';

const MISMATCH_ERROR = 'This page lists topics; the module is set to tags.';

const createMockContext = (module: { taxonomy?: string | null } | null) => {
  const fetchCalls: { query: string; params: unknown }[] = [];

  const context = {
    getClient: () => ({
      withConfig: () => ({
        fetch: async (query: string, params: unknown) => {
          fetchCalls.push({ query, params });
          return module;
        },
      }),
    }),
  } as unknown as ValidationContext;

  return { context, fetchCalls };
};

describe('validateTaxonomyListMatchesKind', () => {
  it('passes when no reference is set yet, without querying', async () => {
    const validate = validateTaxonomyListMatchesKind(
      TAXONOMY_KIND.TOPICS,
      MISMATCH_ERROR,
    );
    const { context, fetchCalls } = createMockContext(null);

    await expect(validate(undefined, context)).resolves.toBe(true);
    expect(fetchCalls).toHaveLength(0);
  });

  it('passes when the referenced module matches the page kind', async () => {
    const validate = validateTaxonomyListMatchesKind(
      TAXONOMY_KIND.TOPICS,
      MISMATCH_ERROR,
    );
    const { context } = createMockContext({ taxonomy: TAXONOMY_KIND.TOPICS });

    await expect(validate({ _ref: 'taxonomy-list-1' }, context)).resolves.toBe(
      true,
    );
  });

  it('passes when the referenced module has no taxonomy set', async () => {
    const validate = validateTaxonomyListMatchesKind(
      TAXONOMY_KIND.TOPICS,
      MISMATCH_ERROR,
    );
    const { context } = createMockContext({ taxonomy: undefined });

    await expect(validate({ _ref: 'taxonomy-list-1' }, context)).resolves.toBe(
      true,
    );
  });

  it('fails when the referenced module lists the other kind', async () => {
    const validate = validateTaxonomyListMatchesKind(
      TAXONOMY_KIND.TOPICS,
      MISMATCH_ERROR,
    );
    const { context } = createMockContext({ taxonomy: TAXONOMY_KIND.TAGS });

    await expect(validate({ _ref: 'taxonomy-list-1' }, context)).resolves.toBe(
      MISMATCH_ERROR,
    );
  });

  it('queries by the reference id', async () => {
    const validate = validateTaxonomyListMatchesKind(
      TAXONOMY_KIND.TAGS,
      'This page lists tags; the module is set to topics.',
    );
    const { context, fetchCalls } = createMockContext({
      taxonomy: TAXONOMY_KIND.TAGS,
    });

    await validate({ _ref: 'taxonomy-list-1' }, context);

    expect(fetchCalls[0]?.params).toEqual({ id: 'taxonomy-list-1' });
  });
});
