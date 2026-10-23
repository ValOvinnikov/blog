import { LOCALE_ISO_CODES, NEXT_NAVIGATION_ERROR } from '@blog/config';
import { errorResult, okResult } from '@blog/utils';
import { JSON_LD_SCRIPT_TEST_ID } from '@web/constants/json-ld';
import { getRequestContext } from '@web/server/request-context/request-context';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { DEFAULT_REQUEST_CONTEXT } from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';
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
      <div data-testid={HOME_MODULE_RENDERER_TEST_ID}>
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

const HEADING = 'Welcome to the blog';
const HOME_MODULE_RENDERER_TEST_ID = 'home-module-renderer';

describe(`<${HomePage.name}/>`, () => {
  beforeEach(() => {
    getHomePageMock.mockReset();
    vi.mocked(getRequestContext).mockResolvedValue(DEFAULT_REQUEST_CONTEXT);
  });

  describe('when the page cannot be rendered', () => {
    it('calls notFound() and logs when the fetch fails', async () => {
      getHomePageMock.mockResolvedValue(errorResult(new Error('boom')));

      await expect(setup()).rejects.toThrow(
        NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
      );

      expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
      expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
        'home_page.fetch_failed',
        expect.anything(),
      );
    });

    it('calls notFound() without logging when the home page simply does not exist', async () => {
      getHomePageMock.mockResolvedValue(okResult());

      await expect(setup()).rejects.toThrow(
        NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
      );

      expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
      expect(vi.mocked(logger.error)).not.toHaveBeenCalled();
    });
  });

  it('redirects to / when this language has no Home of its own', async () => {
    vi.mocked(getRequestContext).mockResolvedValue({
      ...DEFAULT_REQUEST_CONTEXT,
      locale: LOCALE_ISO_CODES.NL,
      liveLocales: [LOCALE_ISO_CODES.EN, LOCALE_ISO_CODES.NL],
    });
    getHomePageMock.mockResolvedValue(okResult());

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);

    expect(vi.mocked(redirect)).toHaveBeenCalledWith('/');
    expect(vi.mocked(notFound)).not.toHaveBeenCalled();
  });

  describe('with a hero and modules', () => {
    beforeEach(async () => {
      getHomePageMock.mockResolvedValue(
        okResult({
          headingBlock: makeHeadingBlock({ heading: HEADING }),
          hero: { id: 'hero-1', type: 'module_hero' },
          modules: [{ id: 'module-1', type: 'module_content' }],
          faqs: [],
        }),
      );

      await setup();
    });

    it('renders through PageShell: the module renderer inside a single main landmark', () => {
      const main = screen.getByRole('main');
      expect(main).toContainElement(
        screen.getByTestId(HOME_MODULE_RENDERER_TEST_ID),
      );
    });

    it('dispatches HomeModuleRenderer with the fetched hero, heading, and modules', () => {
      expect(homeModuleRendererMock).toHaveBeenCalledWith(
        {
          hero: { id: 'hero-1', type: 'module_hero' },
          headingBlock: makeHeadingBlock({ heading: HEADING }),
          modules: [{ id: 'module-1', type: 'module_content' }],
        },
        undefined,
      );
      expect(
        screen.getByTestId(HOME_MODULE_RENDERER_TEST_ID),
      ).toHaveTextContent('hero-1 — 1 modules');
    });
  });

  it('dispatches HomeModuleRenderer with no hero when the page has none', async () => {
    getHomePageMock.mockResolvedValue(
      okResult({
        headingBlock: makeHeadingBlock({ heading: HEADING }),
        hero: undefined,
        modules: [],
        faqs: [],
      }),
    );

    await setup();

    expect(homeModuleRendererMock).toHaveBeenCalledWith(
      expect.objectContaining({ hero: undefined }),
      undefined,
    );
    expect(screen.getByTestId(HOME_MODULE_RENDERER_TEST_ID)).toHaveTextContent(
      `${HEADING} — 0 modules`,
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
    getHomePageMock.mockResolvedValue(
      okResult({
        headingBlock: makeHeadingBlock(),
        hero: undefined,
        modules: [],
        faqs: [],
      }),
    );

    await setup();

    expect(getHomePageMock).toHaveBeenCalledWith(tenant);
  });

  it('renders no FAQPage JSON-LD when the page has no FAQ questions', async () => {
    getHomePageMock.mockResolvedValue(
      okResult({
        headingBlock: makeHeadingBlock(),
        hero: undefined,
        modules: [],
        faqs: [],
      }),
    );

    await setup();

    expect(
      screen.queryByTestId(JSON_LD_SCRIPT_TEST_ID),
    ).not.toBeInTheDocument();
  });

  it('renders the FAQPage JSON-LD when the page has FAQ questions', async () => {
    getHomePageMock.mockResolvedValue(
      okResult({
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
      }),
    );

    await setup();

    const script = screen.getByTestId(JSON_LD_SCRIPT_TEST_ID);
    expect(script.textContent).toContain('"@type":"FAQPage"');
  });
});
