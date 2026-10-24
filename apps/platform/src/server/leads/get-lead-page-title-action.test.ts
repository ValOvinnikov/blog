import { LOCALE_ISO_CODES, NEXT_NAVIGATION_ERROR } from '@blog/config';
import { faker } from '@faker-js/faker';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';

import { fetchPageTitle } from './fetch-page-title';
import { getLeadPageTitleAction } from './get-lead-page-title-action';

faker.seed(5760);

vi.mock('@platform/server/auth/require-tenant-membership');
vi.mock('./fetch-page-title', () => ({ fetchPageTitle: vi.fn() }));

const MOCK_PAGE_TITLE = faker.lorem.words(2);
const MOCK_TITLE_REQUEST = {
  tenantId: MOCK_TENANT_ID,
  documentId: faker.string.alphanumeric(12),
  locale: LOCALE_ISO_CODES.DE,
};
const MOCK_NOT_FOUND = new Error(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);

describe(getLeadPageTitleAction, () => {
  beforeEach(() => {
    vi.mocked(fetchPageTitle).mockReset();
    vi.mocked(fetchPageTitle).mockResolvedValue(MOCK_PAGE_TITLE);
  });

  it("asks for the page's title within the session's tenant", async () => {
    const title = await getLeadPageTitleAction(MOCK_TITLE_REQUEST);

    expect(title).toBe(MOCK_PAGE_TITLE);
    expect(requireTenantMembership).toHaveBeenCalledWith(MOCK_TENANT_ID);
    expect(fetchPageTitle).toHaveBeenCalledWith(MOCK_TITLE_REQUEST);
  });

  it('asks nothing for a caller who is not a member of the tenant', async () => {
    vi.mocked(requireTenantMembership).mockRejectedValueOnce(MOCK_NOT_FOUND);

    await expect(getLeadPageTitleAction(MOCK_TITLE_REQUEST)).rejects.toThrow(
      MOCK_NOT_FOUND,
    );

    expect(fetchPageTitle).not.toHaveBeenCalled();
  });

  it('asks nothing for a language the site cannot have', async () => {
    const title = await getLeadPageTitleAction({
      ...MOCK_TITLE_REQUEST,
      locale: faker.lorem.word() as typeof LOCALE_ISO_CODES.DE,
    });

    expect(title).toBeUndefined();
    expect(fetchPageTitle).not.toHaveBeenCalled();
  });
});
