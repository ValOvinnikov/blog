import { getPost } from '@blog/service/features/pages/post/adaptor/detail-page/loader';
import type { TPostDetail } from '@blog/service/features/pages/post/adaptor/detail-page/types';
import { MOCK_MISSING_ID } from '@blog/service/testing/shared/fixtures';
import { mockTenant } from '@blog/service/testing/tenant';
import { faker } from '@faker-js/faker';

import { createPostService } from './service';

vi.mock('@blog/service/features/pages/post/adaptor/detail-page/loader');

faker.seed(6019);

const mockGetPost = vi.mocked(getPost);
const MOCK_POST_SLUG_ARG = faker.lorem.slug();
const MOCK_POST_DETAIL = {
  title: faker.lorem.words(3),
} as unknown as TPostDetail;
const tenant = mockTenant();

describe(createPostService, () => {
  describe('v1.getPost', () => {
    it('returns the post from the loader', async () => {
      mockGetPost.mockResolvedValue(MOCK_POST_DETAIL);

      const result = await createPostService().v1.getPost(
        MOCK_POST_SLUG_ARG,
        tenant,
      );

      expect(result).toEqual({ ok: true, data: MOCK_POST_DETAIL });
    });

    it('returns no data when no post matches', async () => {
      mockGetPost.mockResolvedValue(undefined);

      const result = await createPostService().v1.getPost(
        MOCK_MISSING_ID,
        tenant,
      );

      expect(result).toEqual({ ok: true, data: undefined });
    });

    it('returns the error when the loader throws', async () => {
      const error = new Error(faker.lorem.sentence());
      mockGetPost.mockRejectedValue(error);

      const result = await createPostService().v1.getPost(
        MOCK_POST_SLUG_ARG,
        tenant,
      );

      expect(result).toEqual({ ok: false, error });
    });
  });
});
