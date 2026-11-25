import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { createMockFaker } from '@platform/testing/mock-faker';
import {
  ADMIN_INVITE_OUTCOME,
  ADMIN_REMOVAL_OUTCOME,
  ADMIN_ROLE,
  GRANTED_VIA,
} from '@shinefold/db/constants';
import type { TAdminInviteListEntry } from '@shinefold/db/queries/admin-invites/list-admin-invites';
import type { TAdminListEntry } from '@shinefold/db/queries/admins/list-admins';
import type { TAdminInvite } from '@shinefold/db/schema/admin-invites';

const adminsFaker = createMockFaker(7868);

export const MOCK_ADMIN_INVITE_ID = adminsFaker.string.uuid();
export const MOCK_INVITED_ADMIN_EMAIL = adminsFaker.internet
  .email()
  .toLowerCase();
export const MOCK_LISTED_ADMIN_ID = adminsFaker.string.uuid();
export const MOCK_LISTED_ADMIN_USER_ID = adminsFaker.string.uuid();
export const MOCK_LISTED_ADMIN_NAME = adminsFaker.person.fullName();
export const MOCK_LISTED_ADMIN_EMAIL = adminsFaker.internet
  .email()
  .toLowerCase();
export const MOCK_ADMIN_INVITED_AT = new Date('2026-11-01T09:00:00.000Z');
export const MOCK_ADMIN_INVITE_EXPIRES_AT = new Date(
  '2026-11-08T09:00:00.000Z',
);
export const MOCK_ADMIN_GRANTED_AT = new Date('2026-10-02T09:00:00.000Z');

export const mockAdminInviteEntry = (
  overrides: Partial<TAdminInviteListEntry> = {},
): TAdminInviteListEntry => ({
  inviteId: MOCK_ADMIN_INVITE_ID,
  email: MOCK_INVITED_ADMIN_EMAIL,
  role: ADMIN_ROLE.ADMIN,
  invitedAt: MOCK_ADMIN_INVITED_AT,
  expiresAt: MOCK_ADMIN_INVITE_EXPIRES_AT,
  ...overrides,
});

export const mockAdminInviteRow = (
  overrides: Partial<TAdminInvite> = {},
): TAdminInvite => ({
  id: MOCK_ADMIN_INVITE_ID,
  emailEncrypted: adminsFaker.string.alphanumeric(32),
  emailIndex: adminsFaker.string.alphanumeric(32),
  emailExactIndex: adminsFaker.string.alphanumeric(32),
  role: ADMIN_ROLE.ADMIN,
  invitedBy: null,
  createdAt: MOCK_ADMIN_INVITED_AT,
  expiresAt: MOCK_ADMIN_INVITE_EXPIRES_AT,
  ...overrides,
});

export const mockAdminListEntry = (
  overrides: Partial<TAdminListEntry> = {},
): TAdminListEntry => ({
  adminId: MOCK_LISTED_ADMIN_ID,
  userId: MOCK_LISTED_ADMIN_USER_ID,
  name: MOCK_LISTED_ADMIN_NAME,
  email: MOCK_LISTED_ADMIN_EMAIL,
  role: ADMIN_ROLE.ADMIN,
  grantedVia: GRANTED_VIA.INVITE,
  grantedAt: MOCK_ADMIN_GRANTED_AT,
  ...overrides,
});

export const mockPlatformAdminsDb = async () => ({
  ...(await mockDbConstants()),
  queries: {
    admins: {
      listAdmins: vi.fn(async () => [mockAdminListEntry()]),
      deleteAdmin: vi.fn(async () => ADMIN_REMOVAL_OUTCOME.REMOVED),
    },
    adminInvites: {
      listAdminInvites: vi.fn(async () => [mockAdminInviteEntry()]),
      createAdminInvite: vi.fn(async () => ({
        outcome: ADMIN_INVITE_OUTCOME.INVITED,
        invite: mockAdminInviteRow(),
      })),
      cancelAdminInvite: vi.fn(async () => true),
    },
    users: {
      deleteUserSessions: vi.fn(async () => 1),
    },
  },
});
