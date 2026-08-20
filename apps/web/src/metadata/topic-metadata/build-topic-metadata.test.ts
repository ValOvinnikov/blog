import { makeTopic } from '@web/testing/shared/topic/fixtures';

import { buildTopicMetadata } from './build-topic-metadata';

const { getTopicPageMock } = vi.hoisted(() => ({
  getTopicPageMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  service: {
    pages: {
      topic: { v1: { getTopicPage: getTopicPageMock } },
    },
  },
}));

const topic = makeTopic();

describe('buildTopicMetadata', () => {
  it('builds metadata from the topic title/description, self-canonical to /topics/[slug]', async () => {
    getTopicPageMock.mockResolvedValue({
      ok: true,
      data: {
        topic,
        posts: [],
        currentPage: 1,
        totalPages: 1,
        total: 0,
      },
    });

    const metadata = await buildTopicMetadata('engineering');

    expect(metadata.title).toBe('Engineering');
    expect(metadata.description).toBe('Posts about building things.');
    expect(metadata.alternates?.canonical).toBe('/topics/engineering');
    expect(metadata.openGraph?.title).toBe('Engineering');
    expect(metadata.openGraph?.description).toBe(
      'Posts about building things.',
    );
    expect(getTopicPageMock).toHaveBeenCalledWith('engineering', {
      page: undefined,
      itemsPerPage: 9,
    });
  });

  it('falls back to the topic title as description when none is authored', async () => {
    getTopicPageMock.mockResolvedValue({
      ok: true,
      data: {
        topic: { ...topic, description: undefined },
        posts: [],
        currentPage: 1,
        totalPages: 1,
        total: 0,
      },
    });

    const metadata = await buildTopicMetadata('engineering');

    expect(metadata.description).toBe('Engineering');
  });

  it('returns empty metadata when the topic does not exist', async () => {
    getTopicPageMock.mockResolvedValue({ ok: true, data: null });

    const metadata = await buildTopicMetadata('missing');

    expect(metadata).toEqual({});
  });

  it('returns empty metadata when the topic fetch fails', async () => {
    getTopicPageMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });

    const metadata = await buildTopicMetadata('engineering');

    expect(metadata).toEqual({});
  });

  it('builds page-N metadata with a "– Page N" suffix, self-canonical to /topics/[slug]/page/N — never /topics/[slug]', async () => {
    getTopicPageMock.mockResolvedValue({
      ok: true,
      data: {
        topic,
        posts: [],
        currentPage: 2,
        totalPages: 3,
        total: 20,
      },
    });

    const metadata = await buildTopicMetadata('engineering', 2);

    expect(metadata.title).toBe('Engineering – Page 2');
    expect(metadata.openGraph?.title).toBe('Engineering – Page 2');
    expect(metadata.alternates?.canonical).toBe('/topics/engineering/page/2');
    expect(metadata.alternates?.canonical).not.toBe('/topics/engineering');
    expect(getTopicPageMock).toHaveBeenCalledWith('engineering', {
      page: 2,
      itemsPerPage: 9,
    });
  });

  it('returns empty metadata for page N when the topic does not exist', async () => {
    getTopicPageMock.mockResolvedValue({ ok: true, data: null });

    const metadata = await buildTopicMetadata('missing', 2);

    expect(metadata).toEqual({});
  });
});
