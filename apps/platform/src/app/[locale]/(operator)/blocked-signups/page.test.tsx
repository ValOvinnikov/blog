import { NEXT_NAVIGATION_ERROR } from '@blog/config';
import { okResult } from '@blog/utils';
import { requireSuperAdmin } from '@platform/server/auth/require-super-admin';
import {
  MOCK_BLOCKED_DOMAIN,
  mockBlockedIdentityListing,
} from '@platform/testing/blocked-signups/fixtures';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { mockDbConstants } from '@platform/testing/mock-db-constants';

import BlockedSignupsPage from './page';

const { listBlockedIdentitiesMock } = vi.hoisted(() => ({
  listBlockedIdentitiesMock: vi.fn(),
}));

vi.mock('@platform/server/auth/require-super-admin');

vi.mock('@platform/server/signup-block/add-blocked-domain-action', () => ({
  addBlockedDomainAction: vi.fn(),
}));

vi.mock('@platform/server/signup-block/remove-blocked-identity-action', () => ({
  removeBlockedIdentityAction: vi.fn(),
}));

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    blockedSignupIdentities: {
      listBlockedIdentities: listBlockedIdentitiesMock,
    },
  },
}));

const setup = customRenderAsync(BlockedSignupsPage, {});

describe(`<${BlockedSignupsPage.name}/>`, () => {
  it('404s for anyone who is not a super admin without reading the list', async () => {
    vi.mocked(requireSuperAdmin).mockRejectedValueOnce(
      new Error(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND),
    );

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);

    expect(listBlockedIdentitiesMock).not.toHaveBeenCalled();
  });

  it('lists every blocked entry', async () => {
    listBlockedIdentitiesMock.mockResolvedValueOnce(
      okResult([mockBlockedIdentityListing()]),
    );

    await setup();

    const domain = screen.getByText(MOCK_BLOCKED_DOMAIN);

    expect(domain).toBeVisible();
  });
});
