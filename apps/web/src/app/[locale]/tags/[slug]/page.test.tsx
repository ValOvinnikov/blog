import TagDetailPage, { generateMetadata, generateStaticParams } from './page';

const { getTagParamsMock } = vi.hoisted(() => ({
  getTagParamsMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  service: {
    pages: {
      tag: { v1: { getTagParams: getTagParamsMock } },
    },
  },
}));

vi.mock('@web/components/pages/tag-page', () => ({
  TagPage: ({ slug }: { slug: string }) => (
    <div data-testid="tag-page">{slug}</div>
  ),
}));

vi.mock('@web/metadata/tag-metadata', () => ({
  buildTagMetadata: vi.fn().mockResolvedValue({ title: 'TypeScript' }),
}));

describe('TagDetailPage', () => {
  describe('generateStaticParams', () => {
    it('returns the tag slugs on success', async () => {
      getTagParamsMock.mockResolvedValue({
        ok: true,
        data: [{ slug: 'typescript' }, { slug: 'react' }],
      });

      const params = await generateStaticParams();

      expect(params).toEqual([{ slug: 'typescript' }, { slug: 'react' }]);
    });

    it('returns an empty array when the fetch resolves to a failure result', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      getTagParamsMock.mockResolvedValue({
        ok: false,
        error: new Error('boom'),
      });

      const params = await generateStaticParams();

      expect(params).toEqual([]);
      errorSpy.mockRestore();
    });
  });

  describe('generateMetadata', () => {
    it('delegates to buildTagMetadata with the resolved slug', async () => {
      const metadata = await generateMetadata({
        params: Promise.resolve({ locale: 'EN', slug: 'typescript' }),
      });

      expect(metadata).toEqual({ title: 'TypeScript' });
    });
  });

  it('renders TagPage with the resolved slug', async () => {
    const ui = await TagDetailPage({
      params: Promise.resolve({ locale: 'EN', slug: 'typescript' }),
    });

    expect(ui.props.slug).toBe('typescript');
  });
});
