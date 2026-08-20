import { service } from '@blog/service';

import { getTopicsSafely } from './get-topics-safely';

vi.mock('@blog/service', () => ({
  service: {
    entities: {
      topics: { v1: { getTopics: vi.fn() } },
    },
  },
}));

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
    vi.mocked(service.entities.topics.v1.getTopics).mockResolvedValue({
      ok: true,
      data: topics,
    });

    await expect(getTopicsSafely()).resolves.toEqual(topics);
  });

  it('falls back to an empty list and logs when the fetch resolves to a failure result', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(service.entities.topics.v1.getTopics).mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });

    await expect(getTopicsSafely()).resolves.toEqual([]);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('topics.fetch_failed'),
    );

    errorSpy.mockRestore();
  });
});
