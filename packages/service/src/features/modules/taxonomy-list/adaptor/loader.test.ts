import { SANITY_CONTENT_REVALIDATE_SECONDS } from '@shinefold/config';
import { TAXONOMY_KIND } from '@shinefold/config/constants';
import {
  MOCK_TOPIC_DESCRIPTION,
  MOCK_TOPIC_ID,
  MOCK_TOPIC_SLUG,
  MOCK_TOPIC_TITLE,
} from '@shinefold/service/testing/entities/fixtures';
import { mockRun } from '@shinefold/service/testing/mock-run-query';
import {
  MOCK_TAXONOMY_LIST_MODULE_ID,
  mockRawTaxonomyEntry,
  mockRawTaxonomyListModule,
} from '@shinefold/service/testing/modules/fixtures';
import {
  MOCK_MODULES_TAXONOMY_LIST_CACHE_TAG,
  MOCK_POSTS_CACHE_TAG,
  MOCK_TAGS_CACHE_TAG,
  MOCK_TOPICS_CACHE_TAG,
  mockCacheTag,
} from '@shinefold/service/testing/sanity/query/cache-tags';
import {
  MOCK_MISSING_ID,
  mockValidationError,
} from '@shinefold/service/testing/shared/fixtures';
import { MOCK_TENANT } from '@shinefold/service/testing/tenant';

import { getTaxonomyList } from './loader';
import { taxonomyListModuleQuery } from './query';

vi.mock('@shinefold/service/sanity/query/query');

describe(getTaxonomyList, () => {
  beforeEach(() => {
    mockRun.mockResolvedValue(
      mockRawTaxonomyListModule({
        taxonomy: TAXONOMY_KIND.TOPICS,
        entries: [mockRawTaxonomyEntry()],
      }),
    );
  });

  it('resolves topic entries from an authored taxonomy', async () => {
    const module = await getTaxonomyList(
      MOCK_TAXONOMY_LIST_MODULE_ID,
      MOCK_TENANT,
    );

    expect(module.taxonomy).toBe(TAXONOMY_KIND.TOPICS);
    expect(module.entries).toEqual([
      {
        id: MOCK_TOPIC_ID,
        title: MOCK_TOPIC_TITLE,
        slug: MOCK_TOPIC_SLUG,
        description: MOCK_TOPIC_DESCRIPTION,
        postCount: 0,
        latestPosts: [],
      },
    ]);
  });

  it('propagates when the module document is missing', async () => {
    mockRun.mockRejectedValueOnce(mockValidationError());

    await expect(
      getTaxonomyList(MOCK_MISSING_ID, MOCK_TENANT),
    ).rejects.toThrow();
  });

  it('scopes the cache tags to the module id, both taxonomy kinds, and posts', async () => {
    await getTaxonomyList(MOCK_TAXONOMY_LIST_MODULE_ID, MOCK_TENANT);

    expect(mockRun).toHaveBeenCalledWith(taxonomyListModuleQuery, {
      parameters: { id: MOCK_TAXONOMY_LIST_MODULE_ID },
      tenant: MOCK_TENANT,
      next: {
        revalidate: SANITY_CONTENT_REVALIDATE_SECONDS,
        tags: [
          MOCK_MODULES_TAXONOMY_LIST_CACHE_TAG,
          mockCacheTag(`module:${MOCK_TAXONOMY_LIST_MODULE_ID}`),
          MOCK_TOPICS_CACHE_TAG,
          MOCK_TAGS_CACHE_TAG,
          MOCK_POSTS_CACHE_TAG,
        ],
      },
    });
  });
});
