import { LOCALE_ISO_CODES, NEXT_NAVIGATION_ERROR } from '@blog/config';
import { faker } from '@faker-js/faker';
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
  homeModuleRendererMock: vi.fn(() => (
    <div data-testid={HOME_MODULE_RENDERER_TEST_ID} />
  )),
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

const HOME_MODULE_RENDERER_TEST_ID = 'home-module-renderer';
const HOME_PAGE_ID = faker.string.uuid();

const makeHomePage = (overrides: Record<string, unknown> = {}) => ({
  id: HOME_PAGE_ID,
  headingBlock: makeHeadingBlock(),
  hero: undefined,
  modules: [],
  faqs: [],
  ...overrides,
});

describe(`<${HomePage.name}/>`, () => {
  beforeEach(() => {
    getHomePageMock.mockReset();
    vi.mocked(getRequestContext).mockResolvedValue(DEFAULT_REQUEST_CONTEXT);
  });

  it('calls notFound() and logs when the fetch fails', async () => {
    const error = new Error('boom');
    getHomePageMock.mockResolvedValue({ ok: false, error });

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
      'home_page.fetch_failed',
      { error },
    );
  });

  it('redirects to / when this language has no Home of its own', async () => {
    vi.mocked(getRequestContext).mockResolvedValue({
      ...DEFAULT_REQUEST_CONTEXT,
      locale: LOCALE_ISO_CODES.NL,
      liveLocales: [LOCALE_ISO_CODES.EN, LOCALE_ISO_CODES.NL],
    });
    getHomePageMock.mockResolvedValue({ ok: true, data: undefined });

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);

    expect(vi.mocked(redirect)).toHaveBeenCalledWith('/');
    expect(vi.mocked(notFound)).not.toHaveBeenCalled();
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
    getHomePageMock.mockResolvedValue({ ok: true, data: makeHomePage() });

    await setup();

    expect(getHomePageMock).toHaveBeenCalledWith(tenant);
  });

  it('renders the module renderer inside a single main landmark', async () => {
    getHomePageMock.mockResolvedValue({ ok: true, data: makeHomePage() });

    await setup();
    const main = screen.getByRole('main');
    const renderer = screen.getByTestId(HOME_MODULE_RENDERER_TEST_ID);

    expect(main).toContainElement(renderer);
  });

  it("passes the page's id, hero, heading and modules to the module renderer", async () => {
    const headingBlock = makeHeadingBlock();
    const hero = { id: 'hero-1', type: 'module_hero' };
    const modules = [{ id: 'module-1', type: 'module_content' }];
    getHomePageMock.mockResolvedValue({
      ok: true,
      data: makeHomePage({ headingBlock, hero, modules }),
    });

    await setup();

    expect(homeModuleRendererMock).toHaveBeenCalledWith(
      { homePageId: HOME_PAGE_ID, hero, headingBlock, modules },
      undefined,
    );
  });

  it('renders the FAQPage JSON-LD when the page has FAQ questions', async () => {
    getHomePageMock.mockResolvedValue({
      ok: true,
      data: makeHomePage({
        faqs: [
          {
            id: 'faq-1',
            question: 'Do you offer a free trial?',
            answer: 'Yes.',
          },
        ],
      }),
    });

    await setup();
    const script = screen.getByTestId(JSON_LD_SCRIPT_TEST_ID);

    expect(script.textContent).toContain('"@type":"FAQPage"');
  });
});
