import { LOCALE_ISO_CODES } from '@blog/config';
import { getRequestContext } from '@web/server/request-context/request-context';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { DEFAULT_REQUEST_CONTEXT } from '@web/testing/shared/tenant/fixtures';
import { notFound, redirect } from 'next/navigation';

import { HomePage } from './home-page';

const { getHomePageMock, homeModuleRendererMock } = vi.hoisted(() => ({
  getHomePageMock: vi.fn(),
  homeModuleRendererMock: vi.fn(
    ({
      hero,
      headingBlock,
      modules,
    }: {
      hero?: { id: string };
      headingBlock: { heading: string };
      modules: { id: string }[];
    }) => (
      <div data-testid="home-module-renderer">
        {hero ? hero.id : headingBlock.heading} — {modules.length} modules
      </div>
    ),
  ),
}));

vi.mock('@web/server/request-context/request-context');

vi.mock('@blog/service', () => ({
  service: {
    pages: {
      home: { v1: { getHomePage: getHomePageMock } },
    },
  },
}));

vi.mock('./home-module-renderer', () => ({
  HomeModuleRenderer: homeModuleRendererMock,
}));

const setup = customRenderAsync(HomePage, {});

describe(`<${HomePage.name}/>`, () => {
  beforeEach(() => {
    getHomePageMock.mockReset();
    vi.mocked(getRequestContext).mockResolvedValue(DEFAULT_REQUEST_CONTEXT);
  });

  it('calls notFound() and logs when the fetch fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getHomePageMock.mockResolvedValue({ ok: false, error: new Error('boom') });

    await expect(setup()).rejects.toThrow('NEXT_NOT_FOUND');

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('home_page.fetch_failed'),
    );

    errorSpy.mockRestore();
  });

  it('calls notFound() without logging when the home page simply does not exist', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getHomePageMock.mockResolvedValue({ ok: true, data: undefined });

    await expect(setup()).rejects.toThrow('NEXT_NOT_FOUND');

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
    expect(errorSpy).not.toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  it('redirects to / when this language has no Home of its own', async () => {
    vi.mocked(getRequestContext).mockResolvedValue({
      ...DEFAULT_REQUEST_CONTEXT,
      locale: LOCALE_ISO_CODES.NL,
      liveLocales: [LOCALE_ISO_CODES.EN, LOCALE_ISO_CODES.NL],
    });
    getHomePageMock.mockResolvedValue({ ok: true, data: undefined });

    await expect(setup()).rejects.toThrow('NEXT_REDIRECT');

    expect(vi.mocked(redirect)).toHaveBeenCalledWith('/');
    expect(vi.mocked(notFound)).not.toHaveBeenCalled();
  });

  it('renders through PageShell: the module renderer inside a single main landmark', async () => {
    getHomePageMock.mockResolvedValue({
      ok: true,
      data: {
        headingBlock: makeHeadingBlock({ heading: 'Welcome to the blog' }),
        hero: { id: 'hero-1', type: 'module_hero' },
        modules: [{ id: 'module-1', type: 'module_content' }],
        faqs: [],
      },
    });

    await setup();

    const main = screen.getByRole('main');
    expect(main).toContainElement(screen.getByTestId('home-module-renderer'));
  });

  it('dispatches HomeModuleRenderer with the fetched hero, heading, and modules', async () => {
    getHomePageMock.mockResolvedValue({
      ok: true,
      data: {
        headingBlock: makeHeadingBlock({ heading: 'Welcome to the blog' }),
        hero: { id: 'hero-1', type: 'module_hero' },
        modules: [{ id: 'module-1', type: 'module_content' }],
        faqs: [],
      },
    });

    await setup();

    expect(homeModuleRendererMock).toHaveBeenCalledWith(
      {
        hero: { id: 'hero-1', type: 'module_hero' },
        headingBlock: makeHeadingBlock({ heading: 'Welcome to the blog' }),
        modules: [{ id: 'module-1', type: 'module_content' }],
      },
      undefined,
    );
    expect(screen.getByTestId('home-module-renderer')).toHaveTextContent(
      'hero-1 — 1 modules',
    );
  });

  it('dispatches HomeModuleRenderer with no hero when the page has none', async () => {
    getHomePageMock.mockResolvedValue({
      ok: true,
      data: {
        headingBlock: makeHeadingBlock({ heading: 'Welcome to the blog' }),
        hero: undefined,
        modules: [],
        faqs: [],
      },
    });

    await setup();

    expect(homeModuleRendererMock).toHaveBeenCalledWith(
      expect.objectContaining({ hero: undefined }),
      undefined,
    );
    expect(screen.getByTestId('home-module-renderer')).toHaveTextContent(
      'Welcome to the blog — 0 modules',
    );
  });

  it('forwards the request context Sanity context to getHomePage', async () => {
    const tenant = {
      projectId: 'tenant-project',
      dataset: 'production',
      token: 'tenant-token',
    };
    vi.mocked(getRequestContext).mockResolvedValueOnce({
      ...DEFAULT_REQUEST_CONTEXT,
      sanityContext: tenant,
    });
    getHomePageMock.mockResolvedValue({
      ok: true,
      data: {
        headingBlock: makeHeadingBlock(),
        hero: undefined,
        modules: [],
        faqs: [],
      },
    });

    await setup();

    expect(getHomePageMock).toHaveBeenCalledWith(tenant);
  });

  it('renders no FAQPage JSON-LD when the page has no FAQ questions', async () => {
    getHomePageMock.mockResolvedValue({
      ok: true,
      data: {
        headingBlock: makeHeadingBlock(),
        hero: undefined,
        modules: [],
        faqs: [],
      },
    });

    await setup();

    expect(screen.queryByTestId('json-ld-script')).not.toBeInTheDocument();
  });

  it('renders the FAQPage JSON-LD when the page has FAQ questions', async () => {
    getHomePageMock.mockResolvedValue({
      ok: true,
      data: {
        headingBlock: makeHeadingBlock(),
        hero: undefined,
        modules: [],
        faqs: [
          {
            id: 'faq-1',
            question: 'Do you offer a free trial?',
            answer: 'Yes.',
          },
        ],
      },
    });

    await setup();

    const script = screen.getByTestId('json-ld-script');
    expect(script.textContent).toContain('"@type":"FAQPage"');
  });
});
