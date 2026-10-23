import { NEXT_NAVIGATION_ERROR } from '@blog/config';
import { BLOCKED_IDENTITY_KIND } from '@blog/db/constants';
import { okResult } from '@blog/utils';
import { makeAdmin } from '@platform/testing/admins/fixtures';
import {
  BLOCKED_ADDRESS_ENTRY_ID,
  BLOCKED_ADDRESS_HASH,
  BLOCKED_ADDRESS_HASH_PREVIEW,
  BLOCKED_DOMAIN,
  makeBlockedIdentityListing,
} from '@platform/testing/blocked-signups/fixtures';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { notFound } from 'next/navigation';

import BlockedSignupsPage from './page';

const { requireSuperAdminMock, listBlockedIdentitiesMock } = vi.hoisted(() => ({
  requireSuperAdminMock: vi.fn(),
  listBlockedIdentitiesMock: vi.fn(),
}));

vi.mock('@platform/server/auth/require-super-admin', () => ({
  requireSuperAdmin: requireSuperAdminMock,
}));

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

describe(BlockedSignupsPage, () => {
  beforeEach(() => {
    requireSuperAdminMock.mockReset().mockResolvedValue(makeAdmin());
    listBlockedIdentitiesMock.mockReset().mockResolvedValue(
      okResult([
        makeBlockedIdentityListing(),
        makeBlockedIdentityListing({
          id: BLOCKED_ADDRESS_ENTRY_ID,
          kind: BLOCKED_IDENTITY_KIND.ADDRESS,
          value: BLOCKED_ADDRESS_HASH,
        }),
      ]),
    );
  });

  it('404s for anyone who is not a super admin without reading the list', async () => {
    requireSuperAdminMock.mockImplementation(() => {
      notFound();
    });

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);

    expect(listBlockedIdentitiesMock).not.toHaveBeenCalled();
  });

  it('lists every entry, showing an address only as the start of its hash', async () => {
    await setup();

    const domain = screen.getByText(BLOCKED_DOMAIN);
    const addressHash = screen.getByText(BLOCKED_ADDRESS_HASH_PREVIEW);

    expect(domain).toBeVisible();
    expect(addressHash).toBeVisible();
  });
});
