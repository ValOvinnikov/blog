import { customRenderAsync, screen, within } from '@web/testing/custom-render';
import { makeSeo } from '@web/testing/shared/seo/fixtures';
import { notFound } from 'next/navigation';

import { GenericPage } from './generic-page';

const { getPageMock, moduleRendererMock } = vi.hoisted(() => ({
  getPageMock: vi.fn(),
  moduleRendererMock: vi.fn(({ modules }: { modules: { id: string }[] }) => (
    <div data-testid="module-renderer">{modules.length} modules</div>
  )),
}));

vi.mock('@blog/service', () => ({
  service: {
    pages: {
      generic: { v1: { getPage: getPageMock } },
    },
  },
}));

vi.mock('@web/modules/module-renderer', () => ({
  ModuleRenderer: moduleRendererMock,
}));

vi.mock('@web/components/shared/smart-link', () => ({
  SmartLink: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const setup = customRenderAsync(GenericPage, {
  slug: 'about-us',
  locale: 'EN',
});

describe(`<${GenericPage.name}/>`, () => {
  beforeEach(() => {
    getPageMock.mockReset();
    moduleRendererMock.mockClear();
  });

  it('calls notFound() and logs when the fetch fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getPageMock.mockResolvedValue({ ok: false, error: new Error('boom') });

    await expect(setup({ slug: 'missing' })).rejects.toThrow('NEXT_NOT_FOUND');

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('generic_page.fetch_failed'),
    );

    errorSpy.mockRestore();
  });

  it('calls notFound() without logging when the page simply does not exist', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getPageMock.mockResolvedValue({ ok: true, data: undefined });

    await expect(setup({ slug: 'missing' })).rejects.toThrow('NEXT_NOT_FOUND');

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
    expect(errorSpy).not.toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  it('renders the page title as the h1', async () => {
    getPageMock.mockResolvedValue({
      ok: true,
      data: {
        title: 'About Us',
        slug: 'about-us',
        modules: [],
        seo: makeSeo({
          title: 'About Us',
          description: 'Who we are.',
          ogTitle: 'About Us',
          ogDescription: 'Who we are.',
        }),
      },
    });

    await setup();

    expect(
      screen.getByRole('heading', { level: 1, name: 'About Us' }),
    ).toBeInTheDocument();
  });

  it('renders the ModuleRenderer with the fetched modules', async () => {
    getPageMock.mockResolvedValue({
      ok: true,
      data: {
        title: 'About Us',
        slug: 'about-us',
        modules: [{ id: 'module-1', type: 'module_content' }],
        seo: makeSeo({
          title: 'About Us',
          description: 'Who we are.',
          ogTitle: 'About Us',
          ogDescription: 'Who we are.',
        }),
      },
    });

    await setup();

    expect(screen.getByTestId('module-renderer')).toHaveTextContent(
      '1 modules',
    );
  });

  it('passes the fetched modules and locale to ModuleRenderer', async () => {
    getPageMock.mockResolvedValue({
      ok: true,
      data: {
        title: 'About Us',
        slug: 'about-us',
        modules: [],
        seo: makeSeo({
          title: 'About Us',
          description: 'Who we are.',
          ogTitle: 'About Us',
          ogDescription: 'Who we are.',
        }),
      },
    });

    await setup();

    expect(moduleRendererMock).toHaveBeenCalledWith(
      { modules: [], locale: 'EN' },
      undefined,
    );
  });

  it('renders ModuleRenderer as a direct child of main, with no constrained wrapper around it', async () => {
    getPageMock.mockResolvedValue({
      ok: true,
      data: {
        title: 'About Us',
        slug: 'about-us',
        modules: [{ id: 'module-1', type: 'module_content' }],
        seo: makeSeo({
          title: 'About Us',
          description: 'Who we are.',
          ogTitle: 'About Us',
          ogDescription: 'Who we are.',
        }),
      },
    });

    await setup();

    const main = screen.getByRole('main');
    const moduleRenderer = screen.getByTestId('module-renderer');

    expect(moduleRenderer.parentElement).toBe(main);
  });

  it('renders the Home › {title} breadcrumbs trail', async () => {
    getPageMock.mockResolvedValue({
      ok: true,
      data: {
        title: 'About Us',
        slug: 'about-us',
        modules: [],
        seo: makeSeo({
          title: 'About Us',
          description: 'Who we are.',
          ogTitle: 'About Us',
          ogDescription: 'Who we are.',
        }),
      },
    });

    await setup();

    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' });

    const homeLink = within(nav).getByRole('link', { name: 'Home' });
    expect(homeLink).toHaveAttribute('href', '/');

    const current = within(nav).getByText('About Us');
    expect(current).toHaveAttribute('aria-current', 'page');
    expect(current.tagName).not.toBe('A');
  });

  it('renders the breadcrumb nav as a sibling before <main>, not nested inside it', async () => {
    getPageMock.mockResolvedValue({
      ok: true,
      data: {
        title: 'About Us',
        slug: 'about-us',
        modules: [],
        seo: makeSeo({
          title: 'About Us',
          description: 'Who we are.',
          ogTitle: 'About Us',
          ogDescription: 'Who we are.',
        }),
      },
    });

    await setup();

    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' });
    const main = screen.getByRole('main');

    expect(main.contains(nav)).toBe(false);
    expect(
      nav.compareDocumentPosition(main) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('renders the JSON-LD BreadcrumbList schema script', async () => {
    getPageMock.mockResolvedValue({
      ok: true,
      data: {
        title: 'About Us',
        slug: 'about-us',
        modules: [],
        seo: makeSeo({
          title: 'About Us',
          description: 'Who we are.',
          ogTitle: 'About Us',
          ogDescription: 'Who we are.',
        }),
      },
    });

    const { container } = await setup();

    const scripts = container.querySelectorAll(
      'script[type="application/ld+json"]',
    );
    const breadcrumbScript = Array.from(scripts).find((script) =>
      script.textContent?.includes('"@type":"BreadcrumbList"'),
    );
    expect(breadcrumbScript).toBeDefined();
    expect(breadcrumbScript?.textContent).toContain(
      '"item":"https://example.com/about-us"',
    );
  });
});
