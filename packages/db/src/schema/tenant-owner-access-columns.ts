import type { TSanityLoginProvider } from '@blog/config/constants';
import type { TSanityProjectRole } from '@blog/db/constants';
import { text, timestamp } from 'drizzle-orm/pg-core';

export const tenantOwnerAccessColumns = {
  ownerSanityInviteId: text('owner_sanity_invite_id'),
  ownerInviteSentAt: timestamp('owner_invite_sent_at', { mode: 'date' }),
  ownerInviteAcceptedAt: timestamp('owner_invite_accepted_at', {
    mode: 'date',
  }),
  ownerSanityUserId: text('owner_sanity_user_id'),
  ownerLoginProvider: text(
    'owner_login_provider',
  ).$type<TSanityLoginProvider>(),
  ownerSanityRole: text('owner_sanity_role').$type<TSanityProjectRole>(),
  ownerInviteHeadsUpSentAt: timestamp('owner_invite_heads_up_sent_at'),
  ownerInviteNudgeSentAt: timestamp('owner_invite_nudge_sent_at'),
  ownerSiteReadySentAt: timestamp('owner_site_ready_sent_at'),
};
