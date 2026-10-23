import { LOCALE_ISO_CODES, NEXT_NAVIGATION_ERROR } from '@blog/config';
import { errorResult, okResult } from '@blog/utils';
import { JSON_LD_SCRIPT_TEST_ID } from '@web/constants/json-ld';
import { getRequestContext } from '@web/server/request-context/request-context';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { MOCK_FAQ_PAGE_JSON_LD_FRAGMENT } from '@web/testing/shared/json-ld/fixtures';
import {
  MOCK_REQUEST_CONTEXT,
  MOCK_TENANT_SANITY_CONTEXT,
} from '@web/testing/shared/tenant/fixtures';
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

const HERO = { id: 'hero-1', type: 'module_hero' };
const CONTENT_MODULE = { id: 'module-1', type: 'module_content' };

const resolveHomePageWith = (overrides: Record<string, unknown> = {}) =>
  getHomePageMock.mockResolvedValue(
    okResult({
      headingBlock: mockHeadingBlock({ heading: HEADING }),
      hero: undefined,
      modules: [],
      faqs: [],
      ...overrides,
    }),
  );

describe(`<${HomePage.name}/>`, () => {
  beforeEach(() => {
    getHomePageMock.mockReset();
    vi.mocked(getRequestContext).mockReset();
  });

  describe('when the page cannot be rendered', () => {
    it('calls notFound() and logs when the fetch fails', async () => {
      getHomePageMock.mockResolvedValue(errorResult(MOCK_ERROR));

      await expect(setup()).rejects.toThrow(
        NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
      );

      expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
      expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
        'home_page.fetch_failed',
        { error: MOCK_ERROR },
      );
    });

    it('calls notFound() without logging when the home page does not exist', async () => {
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
      ...MOCK_REQUEST_CONTEXT,
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
      resolveHomePageWith({
        hero: HERO,
        modules: [CONTENT_MODULE],
      });

      await setup();
    });

    it('renders the module renderer inside a single main landmark', () => {
      const main = screen.getByRole('main');
      const renderer = screen.getByTestId(HOME_MODULE_RENDERER_TEST_ID);

      expect(main).toContainElement(renderer);
    });

    it('dispatches the module renderer with the fetched hero, heading, modules', () => {
      const renderer = screen.getByTestId(HOME_MODULE_RENDERER_TEST_ID);

      expect(homeModuleRendererMock).toHaveBeenCalledWith(
        {
          hero: HERO,
          headingBlock: mockHeadingBlock({ heading: HEADING }),
          modules: [CONTENT_MODULE],
        },
        undefined,
      );
      expect(renderer).toHaveTextContent(`${HERO.id} — 1 modules`);
    });
  });

  it('dispatches the module renderer with no hero when the page has none', async () => {
    resolveHomePageWith();

    await setup();

    const renderer = screen.getByTestId(HOME_MODULE_RENDERER_TEST_ID);

    expect(homeModuleRendererMock).toHaveBeenCalledWith(
      {
        hero: undefined,
        headingBlock: mockHeadingBlock({ heading: HEADING }),
        modules: [],
      },
      undefined,
    );
    expect(renderer).toHaveTextContent(`${HEADING} — 0 modules`);
  });

  it('forwards the request context Sanity context to getHomePage', async () => {
    resolveHomePageWith();

    await setup();

    expect(getHomePageMock).toHaveBeenCalledWith(MOCK_TENANT_SANITY_CONTEXT);
  });

  it('renders no FAQPage JSON-LD when the page has no FAQ questions', async () => {
    resolveHomePageWith();

    await setup();

    const script = screen.queryByTestId(JSON_LD_SCRIPT_TEST_ID);

    expect(script).not.toBeInTheDocument();
  });

  it('renders the FAQPage JSON-LD when the page has FAQ questions', async () => {
    resolveHomePageWith({
      faqs: [
        {
          id: 'faq-1',
          question: 'Do you offer a free trial?',
          answer: 'Yes.',
        },
      ],
    });

    await setup();

    const script = screen.getByTestId(JSON_LD_SCRIPT_TEST_ID);

    expect(script.textContent).toContain(MOCK_FAQ_PAGE_JSON_LD_FRAGMENT);
  });
});
