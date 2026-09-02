import { customRenderAsync, screen } from '@web/testing/custom-render';
import { notFound } from 'next/navigation';

import { GenericPage } from './generic-page';

const {
  getPageMock,
  moduleRendererMock,
  getTenantSanityContextMock,
  getTenantBaseUrlMock,
} = vi.hoisted(() => ({
  getPageMock: vi.fn(),
  getTenantSanityContextMock: vi.fn(),
  getTenantBaseUrlMock: vi.fn(),
  // `ModuleRenderer` is an async Server Component — real RSC async-component
  // nesting isn't renderable through `@testing-library/react`'s client
  // renderer. Stubbed as a plain sync component so this suite can assert
  // `GenericPage` passes the right props through without needing a real
  // async render; its own dispatch logic is covered by
  // `module-renderer.test.tsx`. `GenericPageView`'s own rendering (h1,
  // breadcrumbs, JSON-LD) is covered by `generic-page-view.test.tsx`.
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

vi.mock('@web/server/tenant/get-tenant-sanity-context', () => ({
  getTenantSanityContext: getTenantSanityContextMock,
}));

vi.mock('@web/server/tenant/get-tenant-base-url', () => ({
  getTenantBaseUrl: getTenantBaseUrlMock,
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
    getTenantSanityContextMock.mockReset();
    getTenantSanityContextMock.mockResolvedValue(undefined);
    getTenantBaseUrlMock.mockReset();
    getTenantBaseUrlMock.mockResolvedValue('https://example.com');
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
      data: { title: 'About Us', slug: 'about-us', modules: [] },
    });

    await setup();

    expect(
      screen.getByRole('heading', { level: 1, name: 'About Us' }),
    ).toBeInTheDocument();
  });

  it('passes an empty modules array to ModuleRenderer when the editor has not added any', async () => {
    getPageMock.mockResolvedValue({
      ok: true,
      data: { title: 'About Us', slug: 'about-us', modules: [] },
    });

    await setup();

    expect(moduleRendererMock).toHaveBeenCalledWith(
      { modules: [], locale: 'EN' },
      undefined,
    );
  });

  it('passes the fetched modules and locale through to ModuleRenderer when an editor has added some', async () => {
    getPageMock.mockResolvedValue({
      ok: true,
      data: {
        title: 'About Us',
        slug: 'about-us',
        modules: [{ id: 'module-1', type: 'module_content' }],
      },
    });

    await setup();

    expect(moduleRendererMock).toHaveBeenCalledWith(
      {
        modules: [{ id: 'module-1', type: 'module_content' }],
        locale: 'EN',
      },
      undefined,
    );
    expect(screen.getByTestId('module-renderer')).toHaveTextContent(
      '1 modules',
    );
  });

  it('renders ModuleRenderer as a direct child of main, with no constrained wrapper around it', async () => {
    getPageMock.mockResolvedValue({
      ok: true,
      data: {
        title: 'About Us',
        slug: 'about-us',
        modules: [{ id: 'module-1', type: 'module_content' }],
      },
    });

    await setup();

    const main = screen.getByRole('main');
    const moduleRenderer = screen.getByTestId('module-renderer');

    expect(moduleRenderer.parentElement).toBe(main);
  });

  it('forwards the resolved tenant Sanity context to getPage', async () => {
    const tenant = {
      projectId: 'tenant-project',
      dataset: 'production',
      token: 'tenant-token',
    };
    getTenantSanityContextMock.mockResolvedValue(tenant);
    getPageMock.mockResolvedValue({
      ok: true,
      data: { title: 'About Us', slug: 'about-us', modules: [] },
    });

    await setup();

    expect(getPageMock).toHaveBeenCalledWith('about-us', tenant);
  });
});
