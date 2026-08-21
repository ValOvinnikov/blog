import { homePageSchema } from '@cms/schema-types/documents/pages/home-page';
import type { ValidationContext } from 'sanity';

type TArrayFieldDefinition = {
  type: 'array';
  of?: Array<{ name?: string }>;
};

describe('homePageSchema modules allow-list', () => {
  it('permits module_postLatest, module_cta, and module_newsletter, and excludes module_postList', () => {
    const modulesField = homePageSchema.fields?.find(
      (field) => field.name === 'modules',
    ) as TArrayFieldDefinition | undefined;

    if (!modulesField || modulesField.type !== 'array' || !modulesField.of) {
      throw new Error(
        'Expected homePageSchema to define a modules array field.',
      );
    }

    const allowedTypes = modulesField.of.map((member) => member.name);

    expect(allowedTypes).toEqual([
      'module_postLatest',
      'module_cta',
      'module_newsletter',
    ]);
    expect(allowedTypes).not.toContain('module_postList');
  });
});

type TModuleReference = { _type?: string; _ref?: string };
type TCandidate = { heading?: string | null };
type TCustomFn = (
  modules: TModuleReference[] | undefined,
  context: ValidationContext,
) => Promise<string | true>;

const DUPLICATE_HEADING_ERROR =
  'Only one Post Latest module without its own heading is allowed per page — give this one a heading or remove the duplicate.';

/**
 * `validateSinglePostLatestWithoutHeading` is private to home-page.ts; the
 * `modules` field's `validation` builder registers it via `rule.custom(fn)`,
 * so a minimal chainable mock rule captures it the same way page.test.ts
 * captures the slug field's custom validator — no export needed.
 */
const getPostLatestHeadingValidator = (): TCustomFn => {
  const modulesField = homePageSchema.fields?.find(
    (field) => field.name === 'modules',
  );

  if (!modulesField?.validation) {
    throw new Error(
      'Expected homePageSchema to define a modules field with validation.',
    );
  }

  let customFn: TCustomFn | undefined;

  const rule = {
    unique: () => rule,
    error: () => rule,
    custom: (fn: TCustomFn) => {
      customFn = fn;
      return rule;
    },
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exercising a real Sanity validation builder against a minimal mock Rule
  (modulesField.validation as any)(rule);

  if (!customFn) {
    throw new Error(
      'Expected modules field validation to register a custom() rule.',
    );
  }

  return customFn;
};

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

describe('validateSinglePostLatestWithoutHeading', () => {
  it('passes with no module_postLatest candidates and never calls getClient', async () => {
    const validate = getPostLatestHeadingValidator();
    const { context, getClientCalls } = createMockContext([]);
    const modules: TModuleReference[] = [
      { _type: 'module_cta', _ref: 'cta-1' },
    ];

    await expect(validate(modules, context)).resolves.toBe(true);
    expect(getClientCalls).toHaveLength(0);
  });

  it('passes with exactly one module_postLatest candidate regardless of heading, and never calls getClient', async () => {
    const validate = getPostLatestHeadingValidator();
    const { context, getClientCalls } = createMockContext([]);
    const modules: TModuleReference[] = [
      { _type: 'module_postLatest', _ref: 'post-latest-1' },
    ];

    await expect(validate(modules, context)).resolves.toBe(true);
    expect(getClientCalls).toHaveLength(0);
  });

  it('flags two module_postLatest candidates that both have a blank heading', async () => {
    const validate = getPostLatestHeadingValidator();
    const { context } = createMockContext([
      { heading: '' },
      { heading: '   ' },
    ]);
    const modules: TModuleReference[] = [
      { _type: 'module_postLatest', _ref: 'post-latest-1' },
      { _type: 'module_postLatest', _ref: 'post-latest-2' },
    ];

    await expect(validate(modules, context)).resolves.toBe(
      DUPLICATE_HEADING_ERROR,
    );
  });

  it('treats a missing/undefined heading as blank', async () => {
    const validate = getPostLatestHeadingValidator();
    const { context } = createMockContext([{}, { heading: undefined }]);
    const modules: TModuleReference[] = [
      { _type: 'module_postLatest', _ref: 'post-latest-1' },
      { _type: 'module_postLatest', _ref: 'post-latest-2' },
    ];

    await expect(validate(modules, context)).resolves.toBe(
      DUPLICATE_HEADING_ERROR,
    );
  });

  it('passes when only one of two candidates has a blank heading', async () => {
    const validate = getPostLatestHeadingValidator();
    const { context } = createMockContext([
      { heading: '' },
      { heading: 'Latest from the team' },
    ]);
    const modules: TModuleReference[] = [
      { _type: 'module_postLatest', _ref: 'post-latest-1' },
      { _type: 'module_postLatest', _ref: 'post-latest-2' },
    ];

    await expect(validate(modules, context)).resolves.toBe(true);
  });

  it('passes when both candidates have their own heading', async () => {
    const validate = getPostLatestHeadingValidator();
    const { context } = createMockContext([
      { heading: 'Latest from the team' },
      { heading: 'More posts' },
    ]);
    const modules: TModuleReference[] = [
      { _type: 'module_postLatest', _ref: 'post-latest-1' },
      { _type: 'module_postLatest', _ref: 'post-latest-2' },
    ];

    await expect(validate(modules, context)).resolves.toBe(true);
  });

  it('excludes non-module_postLatest references from the candidate ids and the blank count', async () => {
    const validate = getPostLatestHeadingValidator();
    const { context, fetchCalls } = createMockContext([
      { heading: '' },
      { heading: '' },
    ]);
    const modules: TModuleReference[] = [
      { _type: 'module_postLatest', _ref: 'post-latest-1' },
      { _type: 'module_postLatest', _ref: 'post-latest-2' },
      { _type: 'module_cta', _ref: 'cta-1' },
      { _type: 'module_newsletter', _ref: 'newsletter-1' },
    ];

    await expect(validate(modules, context)).resolves.toBe(
      DUPLICATE_HEADING_ERROR,
    );
    expect(fetchCalls[0]?.params).toEqual({
      ids: ['post-latest-1', 'post-latest-2'],
    });
  });

  it('requests the drafts perspective so an unpublished module still counts', async () => {
    const validate = getPostLatestHeadingValidator();
    const { context, withConfigCalls } = createMockContext([
      { heading: '' },
      { heading: '' },
    ]);
    const modules: TModuleReference[] = [
      { _type: 'module_postLatest', _ref: 'post-latest-1' },
      { _type: 'module_postLatest', _ref: 'post-latest-2' },
    ];

    await validate(modules, context);

    expect(withConfigCalls).toEqual([{ perspective: 'drafts' }]);
  });
});
