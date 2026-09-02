import TopicDetailPage, {
  generateMetadata,
  generateStaticParams,
} from './page';

const { getTopicParamsMock, getPlatformSanityContextMock, platformTenant } =
  vi.hoisted(() => ({
    getTopicParamsMock: vi.fn(),
    getPlatformSanityContextMock: vi.fn(),
    platformTenant: {
      projectId: 'platform-project',
      dataset: 'production',
      token: 'platform-token',
    },
  }));

vi.mock('@blog/service', () => ({
  service: {
    pages: {
      topic: { v1: { getTopicParams: getTopicParamsMock } },
    },
  },
  getPlatformSanityContext: getPlatformSanityContextMock,
}));

vi.mock('@web/components/pages/topic-page', () => ({
  TopicPage: ({ slug }: { slug: string }) => (
    <div data-testid="topic-page">{slug}</div>
  ),
}));

vi.mock('@web/metadata/topic-metadata', () => ({
  buildTopicMetadata: vi.fn().mockResolvedValue({ title: 'Engineering' }),
}));

describe('TopicDetailPage', () => {
  describe('generateStaticParams', () => {
    beforeEach(() => {
      getPlatformSanityContextMock.mockReset();
      getPlatformSanityContextMock.mockReturnValue(platformTenant);
    });

    it('returns the topic slugs on success', async () => {
      getTopicParamsMock.mockResolvedValue({
        ok: true,
        data: [{ slug: 'engineering' }, { slug: 'design' }],
      });

      const params = await generateStaticParams();

      expect(params).toEqual([{ slug: 'engineering' }, { slug: 'design' }]);
      expect(getTopicParamsMock).toHaveBeenCalledWith(platformTenant);
    });

    it('returns an empty array when the fetch resolves to a failure result', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      getTopicParamsMock.mockResolvedValue({
        ok: false,
        error: new Error('boom'),
      });

      const params = await generateStaticParams();

      expect(params).toEqual([]);
      errorSpy.mockRestore();
    });
  });

  describe('generateMetadata', () => {
    it('delegates to buildTopicMetadata with the resolved slug', async () => {
      const metadata = await generateMetadata({
        params: Promise.resolve({ locale: 'EN', slug: 'engineering' }),
      });

      expect(metadata).toEqual({ title: 'Engineering' });
    });
  });

  it('renders TopicPage with the resolved slug', async () => {
    const ui = await TopicDetailPage({
      params: Promise.resolve({ locale: 'EN', slug: 'engineering' }),
    });

    expect(ui.props.slug).toBe('engineering');
  });
});
