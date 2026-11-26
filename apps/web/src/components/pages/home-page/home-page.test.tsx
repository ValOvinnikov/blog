import { faker } from '@faker-js/faker';
import {
  CONTENT_ALIGNMENT,
  LOCALE_ISO_CODES,
  NEXT_NAVIGATION_ERROR,
  routes,
} from '@shinefold/config';
import { errorResult, okResult } from '@shinefold/utils';
import { HOME_PAGE_LOG } from '@web/constants/home-page';
import { JSON_LD_SCRIPT_TEST_ID } from '@web/constants/json-ld';
import { getRequestContext } from '@web/server/request-context/request-context';
import { customRenderServerAsync, screen } from '@web/testing/custom-render';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { MOCK_FAQ_PAGE_JSON_LD_FRAGMENT } from '@web/testing/shared/json-ld/fixtures';
import { mockModule } from '@web/testing/shared/module-renderer-contract/fixtures';
import {
  MOCK_REQUEST_CONTEXT,
  MOCK_TENANT_SANITY_CONTEXT,
} from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';
import { notFound, redirect } from 'next/navigation';

import { HomeModuleRenderer } from './home-module-renderer';
import { HomePage } from './home-page';

faker.seed(5189);

const { getHomePageMock } = vi.hoisted(() => ({
  getHomePageMock: vi.fn(),
}));

vi.mock('@web/server/request-context/request-context');

vi.mock('@shinefold/service', () => ({
  service: {
    pages: {
      home: { v1: { getHomePage: getHomePageMock } },
    },
  },
}));

vi.mock('./home-module-renderer');

const setup = customRenderServerAsync(HomePage, {});

const MOCK_HEADING_BLOCK = mockHeadingBlock();
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
      headingBlock: MOCK_HEADING_BLOCK,
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
    it('logs and throws to the error boundary when the fetch fails', async () => {
      getHomePageMock.mockResolvedValue(errorResult(MOCK_ERROR));

      await expect(setup()).rejects.toBe(MOCK_ERROR);

      expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
        HOME_PAGE_LOG.PAGE_FETCH_FAILED,
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

  describe('with a page that has no FAQs', () => {
    beforeEach(async () => {
      resolveHomePageWith();

      await setup();
    });

    it('forwards the request context Sanity context to getHomePage', () => {
      expect(getHomePageMock).toHaveBeenCalledWith(MOCK_TENANT_SANITY_CONTEXT);
    });

    it('renders no FAQPage JSON-LD', () => {
      const script = screen.queryByTestId(JSON_LD_SCRIPT_TEST_ID);

      expect(script).not.toBeInTheDocument();
    });
  });

  it('hands the page id, hero, heading and modules to the module renderer', async () => {
    const hero = mockModule('module_heroBlog');
    const modules = [mockModule('module_cta')];
    resolveHomePageWith({ hero, modules });

    await setup();

    expect(HomeModuleRenderer).toHaveBeenCalledWith({
      homePageId: MOCK_HOME_PAGE_ID,
      hero,
      headingBlock: MOCK_HEADING_BLOCK,
      headingAlignment: CONTENT_ALIGNMENT.LEFT,
      modules,
    });
  });

  it('renders the FAQPage JSON-LD when the page has FAQ questions', async () => {
    resolveHomePageWith({ faqs: [MOCK_FAQ] });

    await setup();

    const script = screen.getByTestId(JSON_LD_SCRIPT_TEST_ID);

    expect(script).toHaveTextContent(MOCK_FAQ_PAGE_JSON_LD_FRAGMENT);
  });
});
