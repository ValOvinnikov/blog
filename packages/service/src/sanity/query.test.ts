import { isr, q, runQuery, type TSlugParams } from './query';

// `vi.mock`'s factory runs eagerly the moment `./client` first resolves
// (importing `./query` above triggers that), so the mocks it returns must be
// initialized via `vi.hoisted` — a plain `const` declared after `vi.mock`
// hits the temporal dead zone.
const { mockFetch, getClientMock } = vi.hoisted(() => {
  const mockFetch = vi.fn();
  const getClientMock = vi.fn(() => ({ fetch: mockFetch }));
  return { mockFetch, getClientMock };
});

vi.mock('./client', () => ({ getClient: getClientMock }));

const testTenant = {
  projectId: 'tenant-a',
  dataset: 'production',
  token: 'tok',
};

/**
 * `.notNull()` fragment fields on a `slice(0)` query make groqd's
 * `builder.parse()` throw — not resolve `null` — when Sanity genuinely
 * returns `null` for "no document matched". A loader's `if (!raw) return
 * null` guard is therefore unreachable for a genuinely-missing document;
 * `runQuery` throws before it, and `safeAsync` at the service boundary is
 * what turns that throw into a clean `ok: false`.
 */
describe(runQuery, () => {
  it('rejects, rather than resolving to a falsy value, when the fetch resolves null for a slice(0)+notNull query', async () => {
    mockFetch.mockResolvedValue(null);

    const query = q
      .parameters<TSlugParams>()
      .star.filterByType('blog_post')
      .filterBy('slug.current == $slug')
      .slice(0)
      .project((sub) => ({ title: sub.field('title').notNull() }));

    await expect(
      runQuery(query, {
        parameters: { slug: 'nonexistent' },
        tenant: testTenant,
      }),
    ).rejects.toThrow();
  });
});

describe(isr, () => {
  it('rejects a call site that omits the project id at compile time', () => {
    // @ts-expect-error -- `scopeProjectId` is required; there is no unscoped form that silently shares a cache tag across tenants.
    isr(['posts', 'author']);
  });

  it('prefixes every tag with t:<projectId>:', () => {
    expect(isr(['posts', 'author'], 'tenant-a')).toEqual({
      next: {
        revalidate: 3600,
        tags: ['t:tenant-a:posts', 't:tenant-a:author'],
      },
    });
  });

  it('accepts a single tag string the same as an array of one', () => {
    expect(isr('posts', 'tenant-a')).toEqual({
      next: { revalidate: 3600, tags: ['t:tenant-a:posts'] },
    });
  });
});

describe('runQuery tenant threading', () => {
  it('rejects a call site that omits tenant context at compile time', async () => {
    const query = q.star.filterByType('blog_post').slice(0);

    // @ts-expect-error -- `tenant` is required on `runQuery`'s options; there is no form that silently reads the platform's project.
    await runQuery(query, {}).catch(() => {});
  });

  it('passes the tenant context through to getClient', async () => {
    mockFetch.mockResolvedValue(null);

    const query = q.star.filterByType('blog_post').slice(0);
    await runQuery(query, { tenant: testTenant }).catch(() => {
      // The slice(0)+notNull edge case from the test above doesn't apply
      // here (no .notNull() fragment); a null fetch resolves to null, not a
      // throw, for this unprojected query — this test only cares that
      // `getClient` (mocked via vi.mock('./client', ...) above) is called
      // with the tenant argument, not with the query's result shape.
    });

    expect(getClientMock).toHaveBeenCalledWith(testTenant);
  });
});
