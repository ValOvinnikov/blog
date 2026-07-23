import { getAuthorPage } from '@blog/service/features/entities/author/adaptor/page/loader';
import type { TAuthorPage } from '@blog/service/features/entities/author/adaptor/page/types';

import { createAuthorService } from './service';

vi.mock('@blog/service/features/entities/author/adaptor/page/loader');

const mockGetAuthorPage = vi.mocked(getAuthorPage);

describe('createAuthorService', () => {
  it('exposes v1.getAuthor as a function', () => {
    const svc = createAuthorService();
    expect(typeof svc.v1.getAuthor).toBe('function');
  });

  it('exposes v1.getAuthorPage as a function', () => {
    const svc = createAuthorService();
    expect(typeof svc.v1.getAuthorPage).toBe('function');
  });

  it('exposes v1.getAuthorParams as a function', () => {
    const svc = createAuthorService();
    expect(typeof svc.v1.getAuthorParams).toBe('function');
  });

  it('exposes v1.getAuthorPosts as a function', () => {
    const svc = createAuthorService();
    expect(typeof svc.v1.getAuthorPosts).toBe('function');
  });

  it('exposes v1.getAuthorPaginationParams as a function', () => {
    const svc = createAuthorService();
    expect(typeof svc.v1.getAuthorPaginationParams).toBe('function');
  });

  describe('v1.getAuthorPage', () => {
    it('resolves ok:true with the loader data on success', async () => {
      const page = { total: 1 } as unknown as TAuthorPage;
      mockGetAuthorPage.mockResolvedValue(page);

      const result = await createAuthorService().v1.getAuthorPage('jane', {
        itemsPerPage: 10,
      });

      expect(result).toEqual({ ok: true, data: page });
    });

    it('resolves ok:true with null data when the author is not found', async () => {
      mockGetAuthorPage.mockResolvedValue(null);

      const result = await createAuthorService().v1.getAuthorPage('missing', {
        itemsPerPage: 10,
      });

      expect(result).toEqual({ ok: true, data: null });
    });

    it('resolves ok:false with the error when the loader throws', async () => {
      const error = new Error('query failed');
      mockGetAuthorPage.mockRejectedValue(error);

      const result = await createAuthorService().v1.getAuthorPage('jane', {
        itemsPerPage: 10,
      });

      expect(result).toEqual({ ok: false, error });
    });
  });
});
