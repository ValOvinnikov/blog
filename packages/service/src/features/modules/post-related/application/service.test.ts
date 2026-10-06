import { getPostRelatedModuleDocument } from '@blog/service/features/modules/post-related/adaptor/module/loader';
import type { TPostRelatedModuleDocument } from '@blog/service/features/modules/post-related/adaptor/module/types';
import { getRelatedPosts } from '@blog/service/features/modules/post-related/adaptor/posts/loader';
import { toPostCard } from '@blog/service/shared/transformers/post/to-post-card';
import { makeRawPostCard } from '@blog/service/testing/pages/fixtures';
import { makeTenant } from '@blog/service/testing/tenant';

import { createPostRelatedModuleService } from './service';

vi.mock('@blog/service/features/modules/post-related/adaptor/module/loader');
vi.mock('@blog/service/features/modules/post-related/adaptor/posts/loader');

const mockGetModule = vi.mocked(getPostRelatedModuleDocument);
const mockGetPosts = vi.mocked(getRelatedPosts);
const tenant = makeTenant();

const moduleDocument = {
  brandVariant: 'PRIMARY',
  limit: 6,
} as unknown as TPostRelatedModuleDocument;
const posts = [toPostCard(makeRawPostCard({ _id: 'related-1' }))];

describe('createPostRelatedModuleService', () => {
  describe('v1.getPostRelated', () => {
    it('loads the related posts with the module limit and combines them with the module', async () => {
      mockGetModule.mockResolvedValue(moduleDocument);
      mockGetPosts.mockResolvedValue(posts);

      const result = await createPostRelatedModuleService().v1.getPostRelated(
        'post-related-1',
        'post-1',
        tenant,
      );

      expect(mockGetModule).toHaveBeenCalledWith('post-related-1', tenant);
      expect(mockGetPosts).toHaveBeenCalledWith('post-1', 6, tenant);
      expect(result).toEqual({
        ok: true,
        data: { brandVariant: 'PRIMARY', posts },
      });
    });

    it('resolves ok:false without looking up posts when the module document fails to load', async () => {
      const error = new Error('ValidationError');
      mockGetModule.mockRejectedValue(error);

      const result = await createPostRelatedModuleService().v1.getPostRelated(
        'missing',
        'post-1',
        tenant,
      );

      expect(result).toEqual({ ok: false, error });
      expect(mockGetPosts).not.toHaveBeenCalled();
    });
  });
});
