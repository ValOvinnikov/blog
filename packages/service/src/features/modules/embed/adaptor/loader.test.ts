import { faker } from '@faker-js/faker';
import { SANITY_CONTENT_REVALIDATE_SECONDS } from '@shinefold/config';
import { mockRun } from '@shinefold/service/testing/mock-run-query';
import {
  MOCK_EMBED_MODULE_ID,
  MOCK_UNPARSABLE_EMBED_URL,
  mockRawEmbed,
  mockRawEmbedModule,
} from '@shinefold/service/testing/modules/embed/fixtures';
import {
  MOCK_LINK_TARGET_CACHE_TAGS,
  mockCacheTag,
} from '@shinefold/service/testing/sanity/query/cache-tags';
import {
  MOCK_MISSING_ID,
  mockValidationError,
} from '@shinefold/service/testing/shared/fixtures';
import { MOCK_TENANT } from '@shinefold/service/testing/tenant';

import { getEmbedModule } from './loader';
import { embedModuleQuery } from './query';

vi.mock('@shinefold/service/sanity/query/query');

faker.seed(3772);

describe(getEmbedModule, () => {
  beforeEach(() => {
    mockRun.mockResolvedValue(
      mockRawEmbedModule({
        embed: mockRawEmbed({ url: MOCK_UNPARSABLE_EMBED_URL }),
      }),
    );
  });

  it('loads the module without an embed when the stored link no longer parses', async () => {
    const module = await getEmbedModule(MOCK_EMBED_MODULE_ID, MOCK_TENANT);

    expect(module.embed).toBeUndefined();
  });

  it('propagates when the module document is missing', async () => {
    mockRun.mockRejectedValueOnce(mockValidationError());

    await expect(
      getEmbedModule(MOCK_MISSING_ID, MOCK_TENANT),
    ).rejects.toThrow();
  });

  it('queries with the tenant and the cache tags scoped to it', async () => {
    await getEmbedModule(MOCK_EMBED_MODULE_ID, MOCK_TENANT);

    expect(mockRun).toHaveBeenCalledWith(embedModuleQuery, {
      parameters: { id: MOCK_EMBED_MODULE_ID },
      tenant: MOCK_TENANT,
      next: {
        revalidate: SANITY_CONTENT_REVALIDATE_SECONDS,
        tags: [
          mockCacheTag('modules:embed'),
          mockCacheTag(`module:${MOCK_EMBED_MODULE_ID}`),
          ...MOCK_LINK_TARGET_CACHE_TAGS,
        ],
      },
    });
  });
});
