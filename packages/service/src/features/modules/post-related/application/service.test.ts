import { faker } from '@faker-js/faker';
import { getPostRelatedModuleDocument } from '@shinefold/service/features/modules/post-related/adaptor/module/loader';
import { toPostRelatedModuleDocument } from '@shinefold/service/features/modules/post-related/adaptor/module/transformer';
import { getRelatedPosts } from '@shinefold/service/features/modules/post-related/adaptor/posts/loader';
import { toPostCard } from '@shinefold/service/shared/transformers/post/to-post-card';
import {
  MOCK_POST_RELATED_MODULE_ID,
  mockRawPostRelatedModule,
} from '@shinefold/service/testing/modules/post-related/fixtures';
import { mockRawPostCard } from '@shinefold/service/testing/pages/fixtures';
import {
  MOCK_MISSING_ID,
  MOCK_POST_ID,
  mockValidationError,
} from '@shinefold/service/testing/shared/fixtures';
import { MOCK_TENANT } from '@shinefold/service/testing/tenant';

import { createPostRelatedModuleService } from './service';

vi.mock(
  '@shinefold/service/features/modules/post-related/adaptor/module/loader',
);
vi.mock(
  '@shinefold/service/features/modules/post-related/adaptor/posts/loader',
);

faker.seed(24);

const MOCK_LIMIT = faker.number.int({ min: 1, max: 12 });
const { limit: MOCK_MODULE_LIMIT, ...MOCK_MODULE_FIELDS } =
  toPostRelatedModuleDocument(mockRawPostRelatedModule({ limit: MOCK_LIMIT }));
const MOCK_POSTS = [toPostCard(mockRawPostCard({ _id: faker.string.uuid() }))];

const { getPostRelated } = createPostRelatedModuleService().v1;

describe(createPostRelatedModuleService, () => {
  describe('v1.getPostRelated', () => {
    it('loads the related posts by the module limit and combines them with it', async () => {
      vi.mocked(getPostRelatedModuleDocument).mockResolvedValue({
        ...MOCK_MODULE_FIELDS,
        limit: MOCK_MODULE_LIMIT,
      });
      vi.mocked(getRelatedPosts).mockResolvedValue(MOCK_POSTS);

      const result = await getPostRelated(
        MOCK_POST_RELATED_MODULE_ID,
        MOCK_POST_ID,
        MOCK_TENANT,
      );

      expect(getPostRelatedModuleDocument).toHaveBeenCalledWith(
        MOCK_POST_RELATED_MODULE_ID,
        MOCK_TENANT,
      );
      expect(getRelatedPosts).toHaveBeenCalledWith(
        MOCK_POST_ID,
        MOCK_LIMIT,
        MOCK_TENANT,
      );
      expect(result).toEqual({
        ok: true,
        data: { ...MOCK_MODULE_FIELDS, posts: MOCK_POSTS },
      });
    });

    it('resolves ok:false without loading posts when the module fails to load', async () => {
      const error = mockValidationError();
      vi.mocked(getPostRelatedModuleDocument).mockRejectedValue(error);

      const result = await getPostRelated(
        MOCK_MISSING_ID,
        MOCK_POST_ID,
        MOCK_TENANT,
      );

      expect(result).toEqual({ ok: false, error });
      expect(getRelatedPosts).not.toHaveBeenCalled();
    });
  });
});
