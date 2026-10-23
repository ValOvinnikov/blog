import { SANITY_CONTENT_REVALIDATE_SECONDS } from '@blog/config';
import { TAXONOMY_KIND } from '@blog/config/constants';
import {
  MOCK_TOPIC_DESCRIPTION,
  MOCK_TOPIC_ID,
  MOCK_TOPIC_SLUG,
  MOCK_TOPIC_TITLE,
} from '@blog/service/testing/entities/fixtures';
import { mockRun } from '@blog/service/testing/mock-run-query';
import {
  MOCK_TAXONOMY_LIST_MODULE_ID,
  mockRawTaxonomyEntry,
  mockRawTaxonomyListModule,
} from '@blog/service/testing/modules/fixtures';
import {
  MOCK_MODULES_TAXONOMY_LIST_CACHE_TAG,
  MOCK_POSTS_CACHE_TAG,
  MOCK_TAGS_CACHE_TAG,
  MOCK_TOPICS_CACHE_TAG,
  mockCacheTag,
} from '@blog/service/testing/sanity/query/cache-tags';
import {
  MOCK_MISSING_ID,
  mockValidationError,
} from '@blog/service/testing/shared/fixtures';
import { mockTenant } from '@blog/service/testing/tenant';

import { getTaxonomyList } from './loader';
import { taxonomyListModuleQuery } from './query';

vi.mock('@blog/service/sanity/query/query');

const tenant = mockTenant();

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
    const module = await getTaxonomyList(MOCK_TAXONOMY_LIST_MODULE_ID, tenant);

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

    await expect(getTaxonomyList(MOCK_MISSING_ID, tenant)).rejects.toThrow();
  });

  it('scopes the cache tags to the module id, both taxonomy kinds, and posts', async () => {
    await getTaxonomyList(MOCK_TAXONOMY_LIST_MODULE_ID, tenant);

    expect(mockRun).toHaveBeenCalledWith(taxonomyListModuleQuery, {
      parameters: { id: MOCK_TAXONOMY_LIST_MODULE_ID },
      tenant,
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
