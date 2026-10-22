import { ERROR_CODE } from '@blog/config/constants';
import { BLOCKED_IDENTITY_KIND } from '@blog/db/constants';
import {
  BLOCK_AUTHOR_EMAIL,
  BLOCKED_ADDRESS_HASH,
  BLOCKED_ADDRESS_HASH_PREVIEW,
  makeBlockedIdentityListing,
} from '@platform/testing/blocked-signups/fixtures';
import { mockDbConstants } from '@platform/testing/mock-db-constants';

import { loadBlockedSignupEntries } from './load-blocked-signup-entries';

const { listBlockedIdentitiesMock } = vi.hoisted(() => ({
  listBlockedIdentitiesMock: vi.fn(),
}));

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    blockedSignupIdentities: {
      listBlockedIdentities: listBlockedIdentitiesMock,
    },
  },
}));

describe(loadBlockedSignupEntries, () => {
  beforeEach(() => {
    listBlockedIdentitiesMock.mockReset();
  });

  it('shows a domain as it is stored and who added it', async () => {
    const listing = makeBlockedIdentityListing();
    listBlockedIdentitiesMock.mockResolvedValue({ ok: true, data: [listing] });

    const entries = await loadBlockedSignupEntries();

    expect(entries).toEqual([
      {
        id: listing.id,
        kind: BLOCKED_IDENTITY_KIND.DOMAIN,
        displayValue: listing.value,
        reason: listing.reason,
        createdAt: listing.createdAt,
        addedBy: BLOCK_AUTHOR_EMAIL,
      },
    ]);
  });

  it('shows only the start of an address hash', async () => {
    listBlockedIdentitiesMock.mockResolvedValue({
      ok: true,
      data: [
        makeBlockedIdentityListing({
          kind: BLOCKED_IDENTITY_KIND.ADDRESS,
          value: BLOCKED_ADDRESS_HASH,
        }),
      ],
    });

    const [entry] = await loadBlockedSignupEntries();

    expect(entry?.displayValue).toBe(BLOCKED_ADDRESS_HASH_PREVIEW);
  });

  it('leaves the author empty when the adding admin is gone', async () => {
    listBlockedIdentitiesMock.mockResolvedValue({
      ok: true,
      data: [makeBlockedIdentityListing({ addedByEmail: null })],
    });

    const [entry] = await loadBlockedSignupEntries();

    expect(entry?.addedBy).toBeNull();
  });

  it('throws when the list cannot be read', async () => {
    listBlockedIdentitiesMock.mockResolvedValue({
      ok: false,
      error: ERROR_CODE.DB_NOT_FOUND,
    });

    await expect(loadBlockedSignupEntries()).rejects.toThrow(
      `Could not list blocked sign-ups: ${ERROR_CODE.DB_NOT_FOUND}`,
    );
  });
});
