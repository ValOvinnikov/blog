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

/**
 * `.notNull()` fragment fields on a `slice(0)` query make groqd's
 * `builder.parse()` throw — not resolve `null` — when Sanity genuinely
 * returns `null` for "no document matched" (the real shape of a `[0]`-sliced
 * GROQ query with no match). `makeSafeQueryRunner` (groqd) has no try/catch
 * around that `.parse()` call, so `runQuery` propagates the throw.
 *
 * A loader's `if (!raw) return null` guard is therefore unreachable for a
 * genuinely-missing document — `runQuery` throws before it — and only
 * catches a fetch that resolves to `null`/`undefined` for some other reason.
 * The real "not found" signal a loader's caller must handle is the throw
 * itself (via `safeAsync` at the `application/service.ts` boundary, #889).
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
      runQuery(query, { parameters: { slug: 'nonexistent' } }),
    ).rejects.toThrow();
  });
});

describe(isr, () => {
  it('leaves tags unprefixed with no project id', () => {
    expect(isr(['posts', 'author'])).toEqual({
      next: { revalidate: 3600, tags: ['posts', 'author'] },
    });
  });

  it('prefixes every tag with t:<projectId>: when a project id is given', () => {
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
  it('passes the tenant context through to getClient', async () => {
    mockFetch.mockResolvedValue(null);
    const tenant = {
      projectId: 'tenant-a',
      dataset: 'production',
      token: 'tok',
    };

    const query = q.star.filterByType('blog_post').slice(0);
    await runQuery(query, { tenant }).catch(() => {
      // The slice(0)+notNull edge case from the test above doesn't apply
      // here (no .notNull() fragment); a null fetch resolves to null, not a
      // throw, for this unprojected query — this test only cares that
      // `getClient` (mocked via vi.mock('./client', ...) above) is called
      // with the tenant argument, not with the query's result shape.
    });

    expect(getClientMock).toHaveBeenCalledWith(tenant);
  });
});
