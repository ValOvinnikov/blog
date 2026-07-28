import { q, runQuery, type TSlugParams } from './query';

vi.mock('./client', () => ({ getClient: () => ({ fetch: mockFetch }) }));

const mockFetch = vi.fn();

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
