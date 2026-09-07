import { validateSingleBlankHeadingPerType } from '@blog/studio/schema-types/helpers/validate-single-blank-heading-per-type';
import type { ValidationContext } from 'sanity';

type TModuleReference = { _type?: string; _ref?: string };
type TCandidate = { id: string; heading?: string | null };

const BLANK_HEADING_ERROR =
  'Only one module of this type without its own heading is allowed per page — give this one a heading or remove the duplicate.';

const createMockContext = (candidates: TCandidate[]) => {
  const getClientCalls: unknown[] = [];
  const withConfigCalls: unknown[] = [];
  const fetchCalls: { query: string; params: unknown }[] = [];

  const getClient = (apiVersionOptions: unknown) => {
    getClientCalls.push(apiVersionOptions);

    return {
      withConfig: (config: unknown) => {
        withConfigCalls.push(config);

        return {
          fetch: async (query: string, params: unknown) => {
            fetchCalls.push({ query, params });
            return candidates;
          },
        };
      },
    };
  };

  const context = { getClient } as unknown as ValidationContext;

  return { context, getClientCalls, withConfigCalls, fetchCalls };
};

describe('validateSingleBlankHeadingPerType', () => {
  it('passes with no candidates and never calls getClient', async () => {
    const validate = validateSingleBlankHeadingPerType(['module_postLatest']);
    const { context, getClientCalls } = createMockContext([]);
    const modules: TModuleReference[] = [
      { _type: 'module_cta', _ref: 'cta-1' },
    ];

    await expect(validate(modules, context)).resolves.toBe(true);
    expect(getClientCalls).toHaveLength(0);
  });

  it('passes with exactly one candidate of a listed type, and never calls getClient', async () => {
    const validate = validateSingleBlankHeadingPerType(['module_postLatest']);
    const { context, getClientCalls } = createMockContext([]);
    const modules: TModuleReference[] = [
      { _type: 'module_postLatest', _ref: 'post-latest-1' },
    ];

    await expect(validate(modules, context)).resolves.toBe(true);
    expect(getClientCalls).toHaveLength(0);
  });

  it('flags two instances of the same listed type that both have a blank heading', async () => {
    const validate = validateSingleBlankHeadingPerType(['module_postLatest']);
    const { context } = createMockContext([
      { id: 'post-latest-1', heading: '' },
      { id: 'post-latest-2', heading: '   ' },
    ]);
    const modules: TModuleReference[] = [
      { _type: 'module_postLatest', _ref: 'post-latest-1' },
      { _type: 'module_postLatest', _ref: 'post-latest-2' },
    ];

    await expect(validate(modules, context)).resolves.toBe(BLANK_HEADING_ERROR);
  });

  it('treats a missing/undefined heading as blank', async () => {
    const validate = validateSingleBlankHeadingPerType(['module_postLatest']);
    const { context } = createMockContext([
      { id: 'post-latest-1' },
      { id: 'post-latest-2', heading: undefined },
    ]);
    const modules: TModuleReference[] = [
      { _type: 'module_postLatest', _ref: 'post-latest-1' },
      { _type: 'module_postLatest', _ref: 'post-latest-2' },
    ];

    await expect(validate(modules, context)).resolves.toBe(BLANK_HEADING_ERROR);
  });

  it('passes when only one of two candidates has a blank heading', async () => {
    const validate = validateSingleBlankHeadingPerType(['module_postLatest']);
    const { context } = createMockContext([
      { id: 'post-latest-1', heading: '' },
      { id: 'post-latest-2', heading: 'Latest from the team' },
    ]);
    const modules: TModuleReference[] = [
      { _type: 'module_postLatest', _ref: 'post-latest-1' },
      { _type: 'module_postLatest', _ref: 'post-latest-2' },
    ];

    await expect(validate(modules, context)).resolves.toBe(true);
  });

  it('passes when both candidates have their own heading', async () => {
    const validate = validateSingleBlankHeadingPerType(['module_postLatest']);
    const { context } = createMockContext([
      { id: 'post-latest-1', heading: 'Latest from the team' },
      { id: 'post-latest-2', heading: 'More posts' },
    ]);
    const modules: TModuleReference[] = [
      { _type: 'module_postLatest', _ref: 'post-latest-1' },
      { _type: 'module_postLatest', _ref: 'post-latest-2' },
    ];

    await expect(validate(modules, context)).resolves.toBe(true);
  });

  it('excludes references outside the listed types from the candidate ids and the blank count', async () => {
    const validate = validateSingleBlankHeadingPerType(['module_postLatest']);
    const { context, fetchCalls } = createMockContext([
      { id: 'post-latest-1', heading: '' },
      { id: 'post-latest-2', heading: '' },
    ]);
    const modules: TModuleReference[] = [
      { _type: 'module_postLatest', _ref: 'post-latest-1' },
      { _type: 'module_postLatest', _ref: 'post-latest-2' },
      { _type: 'module_cta', _ref: 'cta-1' },
      { _type: 'module_newsletter', _ref: 'newsletter-1' },
    ];

    await expect(validate(modules, context)).resolves.toBe(BLANK_HEADING_ERROR);
    expect(fetchCalls[0]?.params).toEqual({
      ids: ['post-latest-1', 'post-latest-2'],
    });
  });

  it('requests the drafts perspective so an unpublished module still counts', async () => {
    const validate = validateSingleBlankHeadingPerType(['module_postLatest']);
    const { context, withConfigCalls } = createMockContext([
      { id: 'post-latest-1', heading: '' },
      { id: 'post-latest-2', heading: '' },
    ]);
    const modules: TModuleReference[] = [
      { _type: 'module_postLatest', _ref: 'post-latest-1' },
      { _type: 'module_postLatest', _ref: 'post-latest-2' },
    ];

    await validate(modules, context);

    expect(withConfigCalls).toEqual([{ perspective: 'drafts' }]);
  });

  it('flags two blank-heading instances of the same type among several listed types', async () => {
    const validate = validateSingleBlankHeadingPerType([
      'module_postLatest',
      'module_postFeatured',
    ]);
    const { context } = createMockContext([
      { id: 'post-latest-1', heading: '' },
      { id: 'post-latest-2', heading: '' },
    ]);
    const modules: TModuleReference[] = [
      { _type: 'module_postLatest', _ref: 'post-latest-1' },
      { _type: 'module_postLatest', _ref: 'post-latest-2' },
      { _type: 'module_postFeatured', _ref: 'post-featured-1' },
    ];

    await expect(validate(modules, context)).resolves.toBe(BLANK_HEADING_ERROR);
  });

  it('passes with one blank-heading instance each of two different listed types', async () => {
    const validate = validateSingleBlankHeadingPerType([
      'module_postLatest',
      'module_postFeatured',
    ]);
    const { context, getClientCalls } = createMockContext([]);
    const modules: TModuleReference[] = [
      { _type: 'module_postLatest', _ref: 'post-latest-1' },
      { _type: 'module_postFeatured', _ref: 'post-featured-1' },
    ];

    await expect(validate(modules, context)).resolves.toBe(true);
    expect(getClientCalls).toHaveLength(0);
  });
});
