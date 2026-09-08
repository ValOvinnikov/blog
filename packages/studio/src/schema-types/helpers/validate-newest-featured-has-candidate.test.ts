import { POST_SOURCE } from '@blog/config/constants';
import { validateNewestFeaturedHasCandidate } from '@blog/studio/schema-types/helpers/validate-newest-featured-has-candidate';
import type { SanityDocument, ValidationContext } from 'sanity';

const createMockContext = (
  fetchImpl: (query: string, params?: unknown) => unknown,
): ValidationContext => {
  const getClient = () => ({
    withConfig: () => ({
      fetch: async (query: string, params?: unknown) =>
        fetchImpl(query, params),
    }),
  });

  return { getClient } as unknown as ValidationContext;
};

describe('validateNewestFeaturedHasCandidate', () => {
  it('passes without querying when Post Source is not Newest Featured', async () => {
    const validate = validateNewestFeaturedHasCandidate('hero');
    let called = false;
    const context = createMockContext(() => {
      called = true;
      return 0;
    });

    await expect(
      validate(
        { postSource: POST_SOURCE.PINNED } as unknown as SanityDocument,
        context,
      ),
    ).resolves.toBe(true);
    expect(called).toBe(false);
  });

  it('errors with the given render target when no candidate exists', async () => {
    const validate = validateNewestFeaturedHasCandidate('hero');
    const context = createMockContext(() => 0);

    await expect(
      validate(
        {
          postSource: POST_SOURCE.NEWEST_FEATURED,
        } as unknown as SanityDocument,
        context,
      ),
    ).resolves.toBe(
      'No published post is marked Featured, so this hero would render empty.',
    );
  });

  it('substitutes a different render target for a different caller', async () => {
    const validate = validateNewestFeaturedHasCandidate('spotlight');
    const context = createMockContext(() => 0);

    await expect(
      validate(
        {
          postSource: POST_SOURCE.NEWEST_FEATURED,
        } as unknown as SanityDocument,
        context,
      ),
    ).resolves.toBe(
      'No published post is marked Featured, so this spotlight would render empty.',
    );
  });

  it('passes when a candidate exists', async () => {
    const validate = validateNewestFeaturedHasCandidate('hero');
    const context = createMockContext(() => 1);

    await expect(
      validate(
        {
          postSource: POST_SOURCE.NEWEST_FEATURED,
        } as unknown as SanityDocument,
        context,
      ),
    ).resolves.toBe(true);
  });

  it('queries the featured, published post count', async () => {
    const validate = validateNewestFeaturedHasCandidate('hero');
    let receivedQuery = '';
    const context = createMockContext((query) => {
      receivedQuery = query;
      return 1;
    });

    await validate(
      { postSource: POST_SOURCE.NEWEST_FEATURED } as unknown as SanityDocument,
      context,
    );

    expect(receivedQuery).toBe(
      'count(*[_type == "blog_post" && featured == true && publishedAt <= now()])',
    );
  });
});
