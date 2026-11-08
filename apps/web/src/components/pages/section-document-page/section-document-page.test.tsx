import { SITE_MESSAGES } from '@blog/config';
import { NEXT_NAVIGATION_ERROR } from '@blog/config/constants';
import { service } from '@blog/service';
import { errorResult, okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import { SECTION_DOCUMENT_LOG } from '@web/constants/section-document';
import { customRenderServerAsync, screen } from '@web/testing/custom-render';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { stubFakeIntersectionObserver } from '@web/testing/shared/intersection-observer/fake-intersection-observer';
import { mockPortableTextBlock } from '@web/testing/shared/portable-text/fixtures';
import { mockSectionDocumentDetail } from '@web/testing/shared/section-document/fixtures';
import { MOCK_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';
import { notFound } from 'next/navigation';

import { SectionDocumentPage } from './section-document-page';

faker.seed(6522);

vi.mock('@web/server/request-context/request-context');
vi.mock('@web/i18n/navigation');

vi.mock('@blog/service', () => ({
  service: {
    pages: { sectionDocument: { v1: { getSectionDocument: vi.fn() } } },
  },
}));

const getSectionDocumentMock = vi.mocked(
  service.pages.sectionDocument.v1.getSectionDocument,
);

const RAIL_NAME = SITE_MESSAGES.contentsRail.label;
const MOCK_TYPE = 'page_legalDocument';
const MOCK_SLUG = faker.lorem.slug();
const MOCK_TITLE = faker.lorem.words(3);
const MOCK_PARAGRAPH = faker.lorem.sentence();

const setup = customRenderServerAsync(SectionDocumentPage, {
  type: MOCK_TYPE,
  slug: MOCK_SLUG,
});

describe(`<${SectionDocumentPage.name}/>`, () => {
  beforeEach(() => {
    stubFakeIntersectionObserver();
    getSectionDocumentMock.mockResolvedValue(
      okResult(mockSectionDocumentDetail({ title: MOCK_TITLE })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads the document of the given type and slug for the tenant', async () => {
    await setup();

    expect(getSectionDocumentMock).toHaveBeenCalledWith(
      MOCK_TYPE,
      MOCK_SLUG,
      MOCK_TENANT_SANITY_CONTEXT,
    );
  });

  it('renders the title as the page heading', async () => {
    await setup();
    const heading = screen.getByRole('heading', { level: 1 });

    expect(heading).toHaveTextContent(MOCK_TITLE);
  });

  it('renders the body with the contents rail at three or more H2s', async () => {
    await setup();
    const rail = screen.getByRole('navigation', { name: RAIL_NAME });

    expect(rail).toBeVisible();
  });

  it('renders the body without a rail below three H2s', async () => {
    getSectionDocumentMock.mockResolvedValueOnce(
      okResult(
        mockSectionDocumentDetail({
          body: [mockPortableTextBlock(MOCK_PARAGRAPH)],
        }),
      ),
    );

    await setup();
    const paragraph = screen.getByText(MOCK_PARAGRAPH);
    const rail = screen.queryByRole('navigation', { name: RAIL_NAME });

    expect(paragraph).toBeVisible();
    expect(rail).not.toBeInTheDocument();
  });

  it('calls notFound() without logging when no published document matches', async () => {
    getSectionDocumentMock.mockResolvedValueOnce(okResult());

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('logs and calls notFound() when the fetch fails', async () => {
    getSectionDocumentMock.mockResolvedValueOnce(errorResult(MOCK_ERROR));

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith(
      SECTION_DOCUMENT_LOG.PAGE_FETCH_FAILED,
      { type: MOCK_TYPE, slug: MOCK_SLUG, error: MOCK_ERROR },
    );
  });
});
