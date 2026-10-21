import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '@blog/config';
import { ERROR_CODE } from '@blog/config/constants';
import { BLOCKED_IDENTITY_KIND } from '@blog/db/constants';
import { makeAuditEvent } from '@platform/testing/audit-events/fixtures';
import {
  BLOCK_AUTHOR_EMAIL,
  BLOCKED_ADDRESS_HASH,
  BLOCKED_ADDRESS_HASH_PREVIEW,
  makeBlockedIdentity,
} from '@platform/testing/blocked-signups/fixtures';
import { mockDbConstants } from '@platform/testing/mock-db-constants';

import { loadBlockedSignupEntries } from './load-blocked-signup-entries';

const { listBlockedIdentitiesMock, listAuditEventsForTargetMock } = vi.hoisted(
  () => ({
    listBlockedIdentitiesMock: vi.fn(),
    listAuditEventsForTargetMock: vi.fn(),
  }),
);

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    blockedSignupIdentities: {
      listBlockedIdentities: listBlockedIdentitiesMock,
    },
    auditEvents: { listAuditEventsForTarget: listAuditEventsForTargetMock },
  },
}));

const LATER_ADDER_EMAIL = `later-${BLOCK_AUTHOR_EMAIL}`;

const addedEvent = (actorEmail: string) =>
  makeAuditEvent({
    action: AUDIT_ACTION.SIGNUP_BLOCK_ADDED,
    targetType: AUDIT_TARGET_TYPE.BLOCKED_SIGNUP_IDENTITY,
    actorEmail,
  });

describe(loadBlockedSignupEntries, () => {
  beforeEach(() => {
    listBlockedIdentitiesMock.mockReset();
    listAuditEventsForTargetMock
      .mockReset()
      .mockResolvedValue([addedEvent(BLOCK_AUTHOR_EMAIL)]);
  });

  it('shows a domain as it is stored and who added it', async () => {
    const entry = makeBlockedIdentity();
    listBlockedIdentitiesMock.mockResolvedValue({ ok: true, data: [entry] });

    const entries = await loadBlockedSignupEntries();

    expect(entries).toEqual([
      {
        id: entry.id,
        kind: BLOCKED_IDENTITY_KIND.DOMAIN,
        displayValue: entry.value,
        reason: entry.reason,
        createdAt: entry.createdAt,
        addedBy: BLOCK_AUTHOR_EMAIL,
      },
    ]);
  });

  it('shows only the start of an address hash', async () => {
    listBlockedIdentitiesMock.mockResolvedValue({
      ok: true,
      data: [
        makeBlockedIdentity({
          kind: BLOCKED_IDENTITY_KIND.ADDRESS,
          value: BLOCKED_ADDRESS_HASH,
        }),
      ],
    });

    const [entry] = await loadBlockedSignupEntries();

    expect(entry?.displayValue).toBe(BLOCKED_ADDRESS_HASH_PREVIEW);
  });

  it('credits the first admin to add the entry when it was added twice', async () => {
    listBlockedIdentitiesMock.mockResolvedValue({
      ok: true,
      data: [makeBlockedIdentity()],
    });
    listAuditEventsForTargetMock.mockResolvedValue([
      addedEvent(LATER_ADDER_EMAIL),
      addedEvent(BLOCK_AUTHOR_EMAIL),
    ]);

    const [entry] = await loadBlockedSignupEntries();

    expect(entry?.addedBy).toBe(BLOCK_AUTHOR_EMAIL);
  });

  it('leaves the author empty when no add was audited', async () => {
    listBlockedIdentitiesMock.mockResolvedValue({
      ok: true,
      data: [makeBlockedIdentity()],
    });
    listAuditEventsForTargetMock.mockResolvedValue([]);

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
