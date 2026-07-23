import GenericSlugPage, {
  generateMetadata,
  generateStaticParams,
} from './page';

const { getPageSlugsMock } = vi.hoisted(() => ({
  getPageSlugsMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  service: {
    pages: {
      generic: { v1: { getPageSlugs: getPageSlugsMock } },
    },
  },
}));

vi.mock('@web/metadata/generic-page-metadata', () => ({
  buildGenericPageMetadata: vi.fn().mockResolvedValue({ title: 'About Us' }),
}));

vi.mock('@web/components/pages/generic-page', () => ({
  GenericPage: ({ slug, locale }: { slug: string; locale: string }) => (
    <div data-testid="generic-page">
      {slug}-{locale}
    </div>
  ),
}));

vi.mock('next-intl/server', () => ({
  setRequestLocale: vi.fn(),
}));

describe('generateStaticParams', () => {
  it('returns the generic page slugs on success', async () => {
    getPageSlugsMock.mockResolvedValue({
      ok: true,
      data: [{ slug: 'about-us' }, { slug: 'contact' }],
    });

    const params = await generateStaticParams();

    expect(params).toEqual([{ slug: 'about-us' }, { slug: 'contact' }]);
  });

  it('returns an empty array when the fetch fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getPageSlugsMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });

    const params = await generateStaticParams();

    expect(params).toEqual([]);
    errorSpy.mockRestore();
  });
});

describe('generateMetadata', () => {
  it('delegates to buildGenericPageMetadata with the resolved slug', async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: 'EN', slug: 'about-us' }),
    });

    expect(metadata).toEqual({ title: 'About Us' });
  });
});

describe('GenericSlugPage', () => {
  it('renders GenericPage with the resolved locale and slug', async () => {
    const ui = await GenericSlugPage({
      params: Promise.resolve({ locale: 'EN', slug: 'about-us' }),
    });

    expect(ui.props.slug).toBe('about-us');
    expect(ui.props.locale).toBe('EN');
  });
});
