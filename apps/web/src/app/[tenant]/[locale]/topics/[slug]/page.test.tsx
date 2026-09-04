import TopicDetailPage, { generateMetadata } from './page';

vi.mock('@web/components/pages/topic-page', () => ({
  TopicPage: ({ slug }: { slug: string }) => (
    <div data-testid="topic-page">{slug}</div>
  ),
}));

vi.mock('@web/metadata/topic-metadata', () => ({
  buildTopicMetadata: vi.fn().mockResolvedValue({ title: 'Engineering' }),
}));

describe('TopicDetailPage', () => {
  describe('generateMetadata', () => {
    it('delegates to buildTopicMetadata with the resolved slug', async () => {
      const metadata = await generateMetadata({
        params: Promise.resolve({
          tenant: 'tenant-1',
          locale: 'EN',
          slug: 'engineering',
        }),
      });

      expect(metadata).toEqual({ title: 'Engineering' });
    });
  });

  it('renders TopicPage with the resolved slug', async () => {
    const ui = await TopicDetailPage({
      params: Promise.resolve({
        tenant: 'tenant-1',
        locale: 'EN',
        slug: 'engineering',
      }),
    });

    expect(ui.props.slug).toBe('engineering');
  });
});
