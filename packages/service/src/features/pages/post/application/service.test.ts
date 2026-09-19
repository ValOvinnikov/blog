import { getPost } from '@blog/service/features/pages/post/adaptor/detail-page/loader';
import type { TPostDetail } from '@blog/service/features/pages/post/adaptor/detail-page/types';
import { makeTenant } from '@blog/service/testing/tenant';

import { createPostService } from './service';

vi.mock('@blog/service/features/pages/post/adaptor/detail-page/loader');

const mockGetPost = vi.mocked(getPost);
const tenant = makeTenant();

describe('createPostService', () => {
  describe('v1.getPost', () => {
    it('resolves ok:true with the loader data on success', async () => {
      const post = { title: 'Hello' } as unknown as TPostDetail;
      mockGetPost.mockResolvedValue(post);

      const result = await createPostService().v1.getPost('hello', tenant);

      expect(result).toEqual({ ok: true, data: post });
    });

    it('resolves ok:true with undefined data when no page_post matches the slug', async () => {
      mockGetPost.mockResolvedValue(undefined);

      const result = await createPostService().v1.getPost('missing', tenant);

      expect(result).toEqual({ ok: true, data: undefined });
    });

    it('resolves ok:false with the error when the loader throws', async () => {
      const error = new Error('query failed');
      mockGetPost.mockRejectedValue(error);

      const result = await createPostService().v1.getPost('hello', tenant);

      expect(result).toEqual({ ok: false, error });
    });
  });
});
