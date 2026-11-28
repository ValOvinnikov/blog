import {
  MOCK_BLOCK_AUTHOR_EMAIL,
  MOCK_BLOCKED_ADDRESS_HASH,
  MOCK_BLOCKED_ADDRESS_HASH_PREVIEW,
  MOCK_BLOCKING_SUSPENSION,
  mockBlockedIdentityListing,
} from '@platform/testing/blocked-signups/fixtures';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { ERROR_CODE } from '@shinefold/config/constants';
import { BLOCKED_IDENTITY_KIND } from '@shinefold/db/constants';
import { errorResult, okResult } from '@shinefold/utils';

import { loadBlockedSignupEntries } from './load-blocked-signup-entries';

const { listBlockedIdentitiesMock } = vi.hoisted(() => ({
  listBlockedIdentitiesMock: vi.fn(),
}));

vi.mock('@shinefold/db', async () => ({
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
    const listing = mockBlockedIdentityListing();
    listBlockedIdentitiesMock.mockResolvedValue(okResult([listing]));

    const entries = await loadBlockedSignupEntries();

    expect(entries).toEqual([
      {
        id: listing.id,
        kind: BLOCKED_IDENTITY_KIND.DOMAIN,
        displayValue: listing.value,
        reason: listing.reason,
        createdAt: listing.createdAt,
        addedBy: MOCK_BLOCK_AUTHOR_EMAIL,
        suspension: null,
      },
    ]);
  });

  it('names the suspension and site an owner block came from', async () => {
    listBlockedIdentitiesMock.mockResolvedValue(
      okResult([
        mockBlockedIdentityListing({ suspension: MOCK_BLOCKING_SUSPENSION }),
      ]),
    );

    const [entry] = await loadBlockedSignupEntries();

    expect(entry?.suspension).toEqual(MOCK_BLOCKING_SUSPENSION);
  });

  it('shows only the start of an address hash', async () => {
    listBlockedIdentitiesMock.mockResolvedValue(
      okResult([
        mockBlockedIdentityListing({
          kind: BLOCKED_IDENTITY_KIND.ADDRESS,
          value: MOCK_BLOCKED_ADDRESS_HASH,
        }),
      ]),
    );

    const [entry] = await loadBlockedSignupEntries();

    expect(entry?.displayValue).toBe(MOCK_BLOCKED_ADDRESS_HASH_PREVIEW);
  });

  it('leaves the author empty when the adding admin is gone', async () => {
    listBlockedIdentitiesMock.mockResolvedValue(
      okResult([mockBlockedIdentityListing({ addedByEmail: null })]),
    );

    const [entry] = await loadBlockedSignupEntries();

    expect(entry?.addedBy).toBeNull();
  });

  it('throws when the list cannot be read', async () => {
    listBlockedIdentitiesMock.mockResolvedValue(
      errorResult(ERROR_CODE.DB_NOT_FOUND),
    );

    await expect(loadBlockedSignupEntries()).rejects.toThrow(
      `Could not list blocked sign-ups: ${ERROR_CODE.DB_NOT_FOUND}`,
    );
  });
});
