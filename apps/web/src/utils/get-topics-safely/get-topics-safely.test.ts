import { service, type TTenantSanityContext } from '@blog/service';
import { errorResult, okResult } from '@blog/utils';
import { logger } from '@web/utils/logger/logger';

import { getTopicsSafely } from './get-topics-safely';

vi.mock('@blog/service', () => ({
  service: {
    entities: {
      topics: { v1: { getTopics: vi.fn() } },
    },
  },
}));

const tenant: TTenantSanityContext = {
  projectId: 'proj',
  dataset: 'production',
  token: 'tok',
};

describe('getTopicsSafely', () => {
  it('returns the topics from the service on success', async () => {
    const topics = [
      {
        id: 'topic-1',
        title: 'Engineering',
        slug: 'engineering',
        description: undefined,
        postCount: 3,
      },
    ];
    vi.mocked(service.entities.topics.v1.getTopics).mockResolvedValue(
      okResult(topics),
    );

    await expect(getTopicsSafely(tenant)).resolves.toEqual(topics);
  });

  it('falls back to an empty list and logs when the fetch resolves to a failure result', async () => {
    vi.mocked(service.entities.topics.v1.getTopics).mockResolvedValue(
      errorResult(new Error('boom')),
    );

    await expect(getTopicsSafely(tenant)).resolves.toEqual([]);
    expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
      'topics.fetch_failed',
      expect.objectContaining({ error: expect.any(Error) }),
    );
  });
});
