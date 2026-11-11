import type { TTenant } from '@blog/db/schema/tenants';

export const MOCK_NO_OWNER_ACCESS = {
  ownerSanityInviteId: null,
  ownerInviteSentAt: null,
  ownerInviteAcceptedAt: null,
  ownerSanityUserId: null,
  ownerLoginProvider: null,
  ownerSanityRole: null,
  ownerInviteHeadsUpSentAt: null,
  ownerInviteNudgeSentAt: null,
  ownerSiteReadySentAt: null,
} as const satisfies Partial<TTenant>;
