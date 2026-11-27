import 'server-only';

import { queries } from '@shinefold/db';
import { cache } from 'react';

export const isTeamOverSeatsOrLocked = cache(
  async (tenantId: string, seats: number) => {
    const [held, unlocked] = await Promise.all([
      queries.membershipInvites.countSeatsInUse(tenantId),
      queries.membershipInvites.countUnlockedSeatsInUse(tenantId),
    ]);

    return unlocked > seats || held > unlocked;
  },
);
