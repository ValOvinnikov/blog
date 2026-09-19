import type { MigrationContext } from 'sanity/migrate';

import { resolveEntityTitle } from './resolve-entity-title';

const fakeContext = (
  entities: Record<string, unknown> = {},
): MigrationContext =>
  ({
    client: {
      fetch: async (_query: string, params: { ref?: string }) =>
        entities[params.ref ?? ''] ?? null,
    },
  }) as unknown as MigrationContext;

describe(resolveEntityTitle, () => {
  it('returns undefined without a ref, performing no lookup', async () => {
    const fetch = vi.fn(async () => null);
    const context = { client: { fetch } } as unknown as MigrationContext;

    expect(await resolveEntityTitle(context, undefined)).toBeUndefined();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('returns the trimmed title of the referenced entity', async () => {
    const context = fakeContext({ 'blog_tag-1': { title: '  TypeScript  ' } });

    expect(await resolveEntityTitle(context, 'blog_tag-1')).toBe('TypeScript');
  });

  it('returns undefined when the referenced entity has no title', async () => {
    const context = fakeContext({ 'blog_tag-1': { title: '' } });

    expect(await resolveEntityTitle(context, 'blog_tag-1')).toBeUndefined();
  });

  it('returns undefined when the referenced entity cannot be found', async () => {
    const context = fakeContext({});

    expect(await resolveEntityTitle(context, 'missing')).toBeUndefined();
  });
});
