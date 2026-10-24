import { LOCALE_ISO_CODES, NEXT_NAVIGATION_ERROR } from '@blog/config';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';

import { fetchPageTitle } from './fetch-page-title';
import { getLeadPageTitleAction } from './get-lead-page-title-action';

vi.mock('@platform/server/auth/require-tenant-membership');
vi.mock('./fetch-page-title', () => ({ fetchPageTitle: vi.fn() }));

const INPUT = {
  tenantId: MOCK_TENANT_ID,
  documentId: 'page-hire-me',
  locale: LOCALE_ISO_CODES.DE,
};

describe(getLeadPageTitleAction, () => {
  beforeEach(() => {
    vi.mocked(fetchPageTitle).mockReset();
    vi.mocked(fetchPageTitle).mockResolvedValue('Hire me');
  });

  it("asks for the page's title within the session's tenant", async () => {
    await expect(getLeadPageTitleAction(INPUT)).resolves.toBe('Hire me');

    expect(requireTenantMembership).toHaveBeenCalledWith(MOCK_TENANT_ID);
    expect(fetchPageTitle).toHaveBeenCalledWith(INPUT);
  });

  it('asks nothing for a caller who is not a member of the tenant', async () => {
    vi.mocked(requireTenantMembership).mockRejectedValueOnce(
      new Error(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND),
    );

    await expect(getLeadPageTitleAction(INPUT)).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
    );

    expect(fetchPageTitle).not.toHaveBeenCalled();
  });

  it('asks nothing for a language the site cannot have', async () => {
    await expect(
      getLeadPageTitleAction({ ...INPUT, locale: 'XX' as typeof INPUT.locale }),
    ).resolves.toBeUndefined();

    expect(fetchPageTitle).not.toHaveBeenCalled();
  });
});
