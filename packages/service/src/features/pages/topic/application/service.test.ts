import { getTopicPage } from '@blog/service/features/pages/topic/adaptor/detail-page/loader';
import type { TTopicPage } from '@blog/service/features/pages/topic/adaptor/detail-page/types';

import { createTopicService } from './service';

vi.mock('@blog/service/features/pages/topic/adaptor/detail-page/loader');

const mockGetTopicPage = vi.mocked(getTopicPage);

describe('createTopicService', () => {
  it('exposes v1.getTopicPage as a function', () => {
    const svc = createTopicService();
    expect(typeof svc.v1.getTopicPage).toBe('function');
  });

  it('exposes v1.getTopicParams as a function', () => {
    const svc = createTopicService();
    expect(typeof svc.v1.getTopicParams).toBe('function');
  });

  it('exposes v1.getTopicPaginationParams as a function', () => {
    const svc = createTopicService();
    expect(typeof svc.v1.getTopicPaginationParams).toBe('function');
  });

  describe('v1.getTopicPage', () => {
    it('resolves ok:true with the loader data on success', async () => {
      const page = { total: 1 } as unknown as TTopicPage;
      mockGetTopicPage.mockResolvedValue(page);

      const result = await createTopicService().v1.getTopicPage('engineering', {
        itemsPerPage: 10,
      });

      expect(result).toEqual({ ok: true, data: page });
    });

    it('resolves ok:true with null data when the topic is not found', async () => {
      mockGetTopicPage.mockResolvedValue(null);

      const result = await createTopicService().v1.getTopicPage('missing', {
        itemsPerPage: 10,
      });

      expect(result).toEqual({ ok: true, data: null });
    });

    it('resolves ok:false with the error when the loader throws', async () => {
      const error = new Error('query failed');
      mockGetTopicPage.mockRejectedValue(error);

      const result = await createTopicService().v1.getTopicPage('engineering', {
        itemsPerPage: 10,
      });

      expect(result).toEqual({ ok: false, error });
    });
  });
});
