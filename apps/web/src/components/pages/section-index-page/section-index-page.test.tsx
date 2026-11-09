import { routes } from '@blog/config';
import { NEXT_NAVIGATION_ERROR } from '@blog/config/constants';
import { service } from '@blog/service';
import { errorResult, okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import { SECTION_INDEX_LOG } from '@web/constants/section-index';
import type { TModuleComponentProps } from '@web/modules/module-renderer';
import { SectionPagesModule } from '@web/modules/section-pages/section-pages-module';
import { customRenderServerAsync, screen } from '@web/testing/custom-render';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import {
  MOCK_FAQ_PAGE_JSON_LD_FRAGMENT,
  mockFaqPageQuestion,
} from '@web/testing/shared/json-ld/fixtures';
import { readJsonLd } from '@web/testing/shared/json-ld/read-json-ld';
import {
  MOCK_CTA_STUB_TEST_ID,
  MOCK_CONTENT_STUB_TEST_ID,
  MOCK_SECTION_PAGES_STUB_TEST_ID,
  mockModule,
} from '@web/testing/shared/module-renderer-contract/fixtures';
import { getStubTestIds } from '@web/testing/shared/module-renderer-contract/module-renderer-contract';
import { mockSectionIndexPage } from '@web/testing/shared/section-index/fixtures';
import { MOCK_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';
import { notFound } from 'next/navigation';

import { SectionIndexPage } from './section-index-page';

faker.seed(6524);

vi.mock('@web/server/request-context/request-context');
vi.mock('@web/modules/module-gate/module-gate');
vi.mock('@web/server/settings-features/is-module-entitled/is-module-entitled');
vi.mock('@web/modules/content/content-module');
vi.mock('@web/modules/cta/cta-module');
vi.mock('@web/modules/section-pages/section-pages-module', () => ({
  SectionPagesModule: vi.fn(({ id }: TModuleComponentProps) => (
    <div data-testid={MOCK_SECTION_PAGES_STUB_TEST_ID}>{id}</div>
  )),
}));

vi.mock('@blog/service', () => ({
  service: {
    pages: { sectionIndex: { v1: { getSectionIndexPage: vi.fn() } } },
  },
}));

const getSectionIndexPageMock = vi.mocked(
  service.pages.sectionIndex.v1.getSectionIndexPage,
);

const TYPE = 'page_privacyIndex';
const MOCK_HEADING = faker.lorem.words(2);
const MOCK_PAGE = mockSectionIndexPage({
  headingBlock: mockHeadingBlock({ heading: MOCK_HEADING }),
});

const resolvePageWith = (
  overrides: Parameters<typeof mockSectionIndexPage>[0],
) =>
  getSectionIndexPageMock.mockResolvedValueOnce(
    okResult({ ...MOCK_PAGE, ...overrides }),
  );

const setup = customRenderServerAsync(SectionIndexPage, { type: TYPE });

const expectNotFound = async () => {
  await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);
  expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
};

describe(`<${SectionIndexPage.name}/>`, () => {
  beforeEach(() => {
    getSectionIndexPageMock.mockResolvedValue(okResult(MOCK_PAGE));
  });

  describe('when the hub loads', () => {
    beforeEach(async () => {
      await setup();
    });

    it("loads the tenant's hub of the given type", () => {
      expect(getSectionIndexPageMock).toHaveBeenCalledWith(
        TYPE,
        MOCK_TENANT_SANITY_CONTEXT,
      );
    });

    it('renders the hub heading inside main', () => {
      const heading = screen.getByRole('heading', {
        level: 1,
        name: MOCK_HEADING,
      });

      const main = screen.getByRole('main');

      expect(main).toContainElement(heading);
    });
  });

  it('renders the modules the editor composed, in order', async () => {
    resolvePageWith({
      modules: [mockModule('module_cta'), mockModule('module_content')],
    });

    await setup();

    const stubTestIds = getStubTestIds();

    expect(stubTestIds).toEqual([
      MOCK_CTA_STUB_TEST_ID,
      MOCK_CONTENT_STUB_TEST_ID,
    ]);
  });

  it('gives the modules the hub as their page context', async () => {
    const sectionPagesModule = mockModule('module_sectionPages');
    resolvePageWith({ modules: [sectionPagesModule] });

    await setup();

    expect(SectionPagesModule).toHaveBeenCalledWith(
      {
        id: sectionPagesModule.id,
        context: { landingPage: { id: MOCK_PAGE.id, path: routes.privacy() } },
      },
      undefined,
    );
  });

  it('renders the FAQPage JSON-LD when the hub has FAQ questions', async () => {
    resolvePageWith({ faqs: [mockFaqPageQuestion()] });

    await setup();

    expect(readJsonLd()).toContain(MOCK_FAQ_PAGE_JSON_LD_FRAGMENT);
  });

  it('calls notFound() without logging when the language has no hub', async () => {
    getSectionIndexPageMock.mockResolvedValueOnce(okResult());

    await expectNotFound();

    expect(logger.error).not.toHaveBeenCalled();
  });

  it('logs and calls notFound() when the fetch fails', async () => {
    getSectionIndexPageMock.mockResolvedValueOnce(errorResult(MOCK_ERROR));

    await expectNotFound();

    expect(logger.error).toHaveBeenCalledWith(
      SECTION_INDEX_LOG.PAGE_FETCH_FAILED,
      { type: TYPE, error: MOCK_ERROR },
    );
  });
});
