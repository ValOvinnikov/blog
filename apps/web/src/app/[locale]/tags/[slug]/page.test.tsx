import TagDetailPage, { generateMetadata } from './page';

vi.mock('@web/components/pages/tag-page', () => ({
  TagPage: ({ slug }: { slug: string }) => (
    <div data-testid="tag-page">{slug}</div>
  ),
}));

vi.mock('@web/metadata/tag-metadata', () => ({
  buildTagMetadata: vi.fn().mockResolvedValue({ title: 'TypeScript' }),
}));

describe('TagDetailPage', () => {
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
