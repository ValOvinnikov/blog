import { LOCALE_ISO_CODES } from '@blog/config';
import { LeadsTenantProvider } from '@platform/components/features/leads/leads-tenant-provider';
import { renderWithIntl, screen } from '@platform/testing/custom-render';
import { mockInboxLead } from '@platform/testing/leads/fixtures';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';

import { LeadPageSource } from './lead-page-source';

const { getLeadPageTitleActionMock } = vi.hoisted(() => ({
  getLeadPageTitleActionMock: vi.fn(),
}));

vi.mock('@platform/server/leads/get-lead-page-title-action', () => ({
  getLeadPageTitleAction: getLeadPageTitleActionMock,
}));

const SOURCE_PATH = '/en/hire-me';
const DOCUMENT_ID = 'page-hire-me';
const PAGE_TITLE = 'Hire me';

const leadFromPage = mockInboxLead({
  sourcePath: SOURCE_PATH,
  sourceDocumentId: DOCUMENT_ID,
  sourceLocale: LOCALE_ISO_CODES.DE,
});

const renderSource = (lead = leadFromPage) =>
  renderWithIntl(
    <LeadsTenantProvider tenantId={MOCK_TENANT_ID}>
      <LeadPageSource lead={lead} />
    </LeadsTenantProvider>,
  );

describe(`<${LeadPageSource.name}/>`, () => {
  beforeEach(() => {
    getLeadPageTitleActionMock.mockReset();
    getLeadPageTitleActionMock.mockResolvedValue(PAGE_TITLE);
  });

  it("shows the stored path, then swaps in the page's title and language", async () => {
    renderSource();

    expect(screen.getByText(SOURCE_PATH)).toBeVisible();
    expect(await screen.findByText(PAGE_TITLE)).toBeVisible();
    expect(screen.getByText('German')).toBeVisible();
    expect(screen.queryByText(SOURCE_PATH)).not.toBeInTheDocument();
    expect(getLeadPageTitleActionMock).toHaveBeenCalledWith({
      tenantId: MOCK_TENANT_ID,
      documentId: DOCUMENT_ID,
      locale: LOCALE_ISO_CODES.DE,
    });
  });

  it('keeps the path when the title is not available', async () => {
    getLeadPageTitleActionMock.mockResolvedValue(undefined);
    renderSource();

    await vi.waitFor(() =>
      expect(getLeadPageTitleActionMock).toHaveBeenCalled(),
    );
    expect(screen.getByText(SOURCE_PATH)).toBeVisible();
  });

  it('keeps the path when the call fails', async () => {
    getLeadPageTitleActionMock.mockRejectedValue(new Error('offline'));
    renderSource();

    await vi.waitFor(() =>
      expect(getLeadPageTitleActionMock).toHaveBeenCalled(),
    );
    expect(screen.getByText(SOURCE_PATH)).toBeVisible();
  });

  it('asks the website nothing for a lead sent before pages were recorded', () => {
    renderSource(mockInboxLead({ sourcePath: '/' }));

    expect(screen.getByText('Home page')).toBeVisible();
    expect(getLeadPageTitleActionMock).not.toHaveBeenCalled();
  });

  it('asks the website once when the same page is shown again in the same visit', async () => {
    const { rerender } = renderSource();
    await screen.findByText(PAGE_TITLE);

    rerender(
      <LeadsTenantProvider tenantId={MOCK_TENANT_ID}>
        <LeadPageSource lead={{ ...leadFromPage }} key="reopened" />
      </LeadsTenantProvider>,
    );

    expect(await screen.findByText(PAGE_TITLE)).toBeVisible();
    expect(getLeadPageTitleActionMock).toHaveBeenCalledTimes(1);
  });
});
