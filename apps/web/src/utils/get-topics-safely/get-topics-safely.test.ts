import { service } from '@blog/service';
import { errorResult, okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import { MOCK_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';
import { mockTopicWithPostCount } from '@web/testing/shared/topic/fixtures';
import { logger } from '@web/utils/logger/logger';

import { getTopicsSafely } from './get-topics-safely';

faker.seed(114);

const TOPICS_FETCH_FAILED_EVENT = 'topics.fetch_failed';
const MOCK_TOPICS = [mockTopicWithPostCount({ postCount: 3 })];
const MOCK_ERROR = new Error(faker.lorem.sentence());

vi.mock('@blog/service', () => ({
  service: {
    entities: {
      topics: { v1: { getTopics: vi.fn() } },
    },
  },
}));

describe(getTopicsSafely, () => {
  it('returns the topics from the service on success', async () => {
    vi.mocked(service.entities.topics.v1.getTopics).mockResolvedValueOnce(
      okResult(MOCK_TOPICS),
    );

    const topics = await getTopicsSafely(MOCK_TENANT_SANITY_CONTEXT);

    expect(topics).toEqual(MOCK_TOPICS);
  });

  it('falls back to an empty list and logs when the fetch fails', async () => {
    vi.mocked(service.entities.topics.v1.getTopics).mockResolvedValueOnce(
      errorResult(MOCK_ERROR),
    );

    const topics = await getTopicsSafely(MOCK_TENANT_SANITY_CONTEXT);

    expect(topics).toEqual([]);
    expect(logger.error).toHaveBeenCalledWith(TOPICS_FETCH_FAILED_EVENT, {
      error: MOCK_ERROR,
    });
  });
});
