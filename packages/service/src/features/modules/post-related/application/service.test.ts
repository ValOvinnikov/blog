import { BRAND_VARIANT } from '@blog/config/constants';
import { getPostRelatedModuleDocument } from '@blog/service/features/modules/post-related/adaptor/module/loader';
import type { TPostRelatedModuleDocument } from '@blog/service/features/modules/post-related/adaptor/module/types';
import { getRelatedPosts } from '@blog/service/features/modules/post-related/adaptor/posts/loader';
import { toPostCard } from '@blog/service/shared/transformers/post/to-post-card';
import { MOCK_POST_RELATED_MODULE_ID } from '@blog/service/testing/modules/fixtures';
import { mockRawPostCard } from '@blog/service/testing/pages/fixtures';
import {
  MOCK_MISSING_ID,
  MOCK_POST_ID,
  mockValidationError,
} from '@blog/service/testing/shared/fixtures';
import { mockTenant } from '@blog/service/testing/tenant';

import { createPostRelatedModuleService } from './service';

vi.mock('@blog/service/features/modules/post-related/adaptor/module/loader');
vi.mock('@blog/service/features/modules/post-related/adaptor/posts/loader');

const mockGetModule = vi.mocked(getPostRelatedModuleDocument);
const mockGetPosts = vi.mocked(getRelatedPosts);
const tenant = mockTenant();

const moduleDocument = {
  brandVariant: BRAND_VARIANT.PRIMARY,
  limit: 6,
} as unknown as TPostRelatedModuleDocument;
const posts = [toPostCard(mockRawPostCard({ _id: 'related-1' }))];

describe(createPostRelatedModuleService, () => {
  describe('v1.getPostRelated', () => {
    it('loads the related posts by the module limit and combines them with it', async () => {
      mockGetModule.mockResolvedValue(moduleDocument);
      mockGetPosts.mockResolvedValue(posts);

      const result = await createPostRelatedModuleService().v1.getPostRelated(
        MOCK_POST_RELATED_MODULE_ID,
        MOCK_POST_ID,
        tenant,
      );

      expect(mockGetModule).toHaveBeenCalledWith(
        MOCK_POST_RELATED_MODULE_ID,
        tenant,
      );
      expect(mockGetPosts).toHaveBeenCalledWith(MOCK_POST_ID, 6, tenant);
      expect(result).toEqual({
        ok: true,
        data: { brandVariant: BRAND_VARIANT.PRIMARY, posts },
      });
    });

    it('resolves ok:false without loading posts when the module fails to load', async () => {
      const error = mockValidationError();
      mockGetModule.mockRejectedValue(error);

      const result = await createPostRelatedModuleService().v1.getPostRelated(
        MOCK_MISSING_ID,
        MOCK_POST_ID,
        tenant,
      );

      expect(result).toEqual({ ok: false, error });
      expect(mockGetPosts).not.toHaveBeenCalled();
    });
  });
});
