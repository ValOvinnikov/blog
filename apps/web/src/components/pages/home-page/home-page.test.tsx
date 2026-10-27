import {
  CONTENT_ALIGNMENT,
  LOCALE_ISO_CODES,
  NEXT_NAVIGATION_ERROR,
  routes,
} from '@blog/config';
import { errorResult, okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import { JSON_LD_SCRIPT_TEST_ID } from '@web/constants/json-ld';
import { CtaModule } from '@web/modules/cta/cta-module';
import { getRequestContext } from '@web/server/request-context/request-context';
import {
  customRenderServerAsync,
  screen,
  within,
} from '@web/testing/custom-render';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { MOCK_FAQ_PAGE_JSON_LD_FRAGMENT } from '@web/testing/shared/json-ld/fixtures';
import {
  MOCK_CTA_STUB_TEST_ID,
  MOCK_HERO_STUB_TEST_ID,
  mockModule,
} from '@web/testing/shared/module-renderer-contract/fixtures';
import {
  MOCK_REQUEST_CONTEXT,
  MOCK_TENANT_SANITY_CONTEXT,
} from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';
import { notFound, redirect } from 'next/navigation';

import { HomePage } from './home-page';

faker.seed(5189);

const { getHomePageMock } = vi.hoisted(() => ({
  getHomePageMock: vi.fn(),
}));

vi.mock('@web/server/request-context/request-context');

vi.mock('@blog/service', () => ({
  service: {
    pages: {
      home: { v1: { getHomePage: getHomePageMock } },
    },
  },
}));

vi.mock('@web/modules/hero-blog/hero-blog-module');
vi.mock('@web/modules/cta/cta-module');

const setup = customRenderServerAsync(HomePage, {});

const MOCK_HEADING = faker.lorem.sentence();
const MOCK_HOME_PAGE_ID = faker.string.uuid();
const MOCK_FAQ = {
  id: faker.string.uuid(),
  question: faker.lorem.sentence(),
  answer: faker.lorem.sentence(),
};

const resolveHomePageWith = (overrides: Record<string, unknown> = {}) =>
  getHomePageMock.mockResolvedValue(
    okResult({
      id: MOCK_HOME_PAGE_ID,
      headingBlock: mockHeadingBlock({ heading: MOCK_HEADING }),
      headingAlignment: CONTENT_ALIGNMENT.LEFT,
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

  it('redirects home when this language has no Home of its own', async () => {
    vi.mocked(getRequestContext).mockResolvedValue({
      ...MOCK_REQUEST_CONTEXT,
      locale: LOCALE_ISO_CODES.NL,
      liveLocales: [LOCALE_ISO_CODES.EN, LOCALE_ISO_CODES.NL],
    });
    getHomePageMock.mockResolvedValue(okResult());

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);

    expect(vi.mocked(redirect)).toHaveBeenCalledWith(routes.home());
    expect(vi.mocked(notFound)).not.toHaveBeenCalled();
  });

  it('renders the page heading inside main when the page has no hero', async () => {
    resolveHomePageWith();

    await setup();

    const main = screen.getByRole('main');
    const heading = within(main).getByRole('heading', {
      level: 1,
      name: MOCK_HEADING,
    });

    expect(heading).toBeVisible();
  });

  it('renders the hero and the modules inside main', async () => {
    const hero = mockModule('module_heroBlog');
    const ctaModule = mockModule('module_cta');
    resolveHomePageWith({ hero, modules: [ctaModule] });

    await setup();

    const main = screen.getByRole('main');
    const heroStub = within(main).getByTestId(MOCK_HERO_STUB_TEST_ID);
    const ctaStub = within(main).getByTestId(MOCK_CTA_STUB_TEST_ID);
    const pageHeading = screen.queryByRole('heading', { name: MOCK_HEADING });

    expect(heroStub).toHaveTextContent(hero.id);
    expect(ctaStub).toHaveTextContent(ctaModule.id);
    expect(pageHeading).not.toBeInTheDocument();
  });

  it('hands the home page id to its modules as context', async () => {
    const ctaModule = mockModule('module_cta');
    resolveHomePageWith({ modules: [ctaModule] });

    await setup();

    expect(CtaModule).toHaveBeenCalledWith(
      { id: ctaModule.id, context: { homePage: { id: MOCK_HOME_PAGE_ID } } },
      undefined,
    );
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
    resolveHomePageWith({ faqs: [MOCK_FAQ] });

    await setup();

    const script = screen.getByTestId(JSON_LD_SCRIPT_TEST_ID);

    expect(script).toHaveTextContent(MOCK_FAQ_PAGE_JSON_LD_FRAGMENT);
  });
});
