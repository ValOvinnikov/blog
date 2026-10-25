import { LOCALE_ISO_CODES } from '@blog/config';
import { faker } from '@faker-js/faker';
import { LeadsTenantProvider } from '@platform/components/features/leads/leads-tenant-provider';
import {
  renderWithIntl,
  screen,
  waitFor,
} from '@platform/testing/custom-render';
import {
  MOCK_LEAD_SOURCE_PATH,
  mockInboxLead,
} from '@platform/testing/leads/fixtures';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';

import { LeadPageSource } from './lead-page-source';

faker.seed(5757);

const { getLeadPageTitleActionMock } = vi.hoisted(() => ({
  getLeadPageTitleActionMock: vi.fn(),
}));

vi.mock('@platform/server/leads/get-lead-page-title-action', () => ({
  getLeadPageTitleAction: getLeadPageTitleActionMock,
}));

const MOCK_DOCUMENT_ID = faker.string.alphanumeric(12);
const MOCK_PAGE_TITLE = faker.lorem.words(3);
const MOCK_LEAD_FROM_PAGE = mockInboxLead({
  sourceDocumentId: MOCK_DOCUMENT_ID,
  sourceLocale: LOCALE_ISO_CODES.DE,
});

const renderSources = (count = 1, lead = MOCK_LEAD_FROM_PAGE) =>
  renderWithIntl(
    <LeadsTenantProvider tenantId={MOCK_TENANT_ID}>
      {Array.from({ length: count }, (_, index) => (
        <LeadPageSource key={index} lead={lead} />
      ))}
    </LeadsTenantProvider>,
  );

describe(`<${LeadPageSource.name}/>`, () => {
  beforeEach(() => {
    getLeadPageTitleActionMock.mockReset();
    getLeadPageTitleActionMock.mockResolvedValue(MOCK_PAGE_TITLE);
  });

  it('shows the stored path until the title arrives', () => {
    getLeadPageTitleActionMock.mockReturnValue(new Promise(() => {}));
    renderSources();

    const path = screen.getByText(MOCK_LEAD_SOURCE_PATH);

    expect(path).toBeVisible();
  });

  describe('for a lead from a recorded page', () => {
    beforeEach(async () => {
      renderSources();
      await screen.findByText(MOCK_PAGE_TITLE);
    });

    it("swaps the path for the page's title and language", () => {
      const title = screen.getByText(MOCK_PAGE_TITLE);
      const language = screen.getByText('German');
      const path = screen.queryByText(MOCK_LEAD_SOURCE_PATH);

      expect(title).toBeVisible();
      expect(language).toBeVisible();
      expect(path).not.toBeInTheDocument();
    });

    it('asks for the page in the language the message was sent in', () => {
      expect(getLeadPageTitleActionMock).toHaveBeenCalledWith({
        tenantId: MOCK_TENANT_ID,
        documentId: MOCK_DOCUMENT_ID,
        locale: LOCALE_ISO_CODES.DE,
      });
    });
  });

  it.each([
    [
      'the title is not available',
      () => getLeadPageTitleActionMock.mockResolvedValue(undefined),
    ],
    [
      'the call fails',
      () => getLeadPageTitleActionMock.mockRejectedValue(new Error()),
    ],
  ])('keeps the path when %s', async (_label, arrange) => {
    arrange();
    renderSources();

    await waitFor(() =>
      expect(getLeadPageTitleActionMock).toHaveBeenCalledTimes(1),
    );
    const path = screen.getByText(MOCK_LEAD_SOURCE_PATH);
    expect(path).toBeVisible();
  });

  it('asks the website once for a page shown twice in the same visit', async () => {
    renderSources(2);

    const titles = await screen.findAllByText(MOCK_PAGE_TITLE);

    expect(titles).toHaveLength(2);
    expect(getLeadPageTitleActionMock).toHaveBeenCalledTimes(1);
  });

  it('asks nothing for a lead sent before pages were recorded', () => {
    renderSources(1, mockInboxLead({ sourcePath: '/' }));

    const homePage = screen.getByText('Home page');

    expect(homePage).toBeVisible();
    expect(getLeadPageTitleActionMock).not.toHaveBeenCalled();
  });
});
