import { NEXT_NAVIGATION_ERROR } from '@blog/config/constants';
import { service } from '@blog/service';
import { errorResult, okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import { SECTION_DOCUMENT_LOG } from '@web/constants/section-document';
import { customRenderServerAsync, screen } from '@web/testing/custom-render';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { stubFakeIntersectionObserver } from '@web/testing/shared/intersection-observer/fake-intersection-observer';
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

const MOCK_TYPE = 'page_legalDocument';
const MOCK_SLUG = faker.lorem.slug();
const MOCK_TITLE = faker.lorem.words(3);
const MOCK_HEADING = faker.lorem.words(4);

const setup = customRenderServerAsync(SectionDocumentPage, {
  type: MOCK_TYPE,
  slug: MOCK_SLUG,
});

const expectNotFound = async () => {
  await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);
  expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
};

describe(`<${SectionDocumentPage.name}/>`, () => {
  beforeEach(() => {
    stubFakeIntersectionObserver();
    getSectionDocumentMock.mockResolvedValue(
      okResult(
        mockSectionDocumentDetail({
          title: MOCK_TITLE,
          headingBlock: mockHeadingBlock({ heading: MOCK_HEADING }),
        }),
      ),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('when the page loads', () => {
    beforeEach(async () => {
      await setup();
    });

    it('loads the document of the given type and slug for the tenant', () => {
      expect(getSectionDocumentMock).toHaveBeenCalledWith(
        MOCK_TYPE,
        MOCK_SLUG,
        MOCK_TENANT_SANITY_CONTEXT,
      );
    });

    it('renders the heading block as the page heading', () => {
      const heading = screen.getByRole('heading', { level: 1 });

      expect(heading).toHaveTextContent(MOCK_HEADING);
    });

    it('never renders the internal title', () => {
      const title = screen.queryByText(MOCK_TITLE);

      expect(title).not.toBeInTheDocument();
    });
  });

  it('calls notFound() without logging when no published document matches', async () => {
    getSectionDocumentMock.mockResolvedValueOnce(okResult());

    await expectNotFound();

    expect(logger.error).not.toHaveBeenCalled();
  });

  it('logs and calls notFound() when the fetch fails', async () => {
    getSectionDocumentMock.mockResolvedValueOnce(errorResult(MOCK_ERROR));

    await expectNotFound();

    expect(logger.error).toHaveBeenCalledWith(
      SECTION_DOCUMENT_LOG.PAGE_FETCH_FAILED,
      { type: MOCK_TYPE, slug: MOCK_SLUG, error: MOCK_ERROR },
    );
  });
});
