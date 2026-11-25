import 'server-only';

import { queries } from '@shinefold/db';
import { cache } from 'react';

export const isTenantOverSeats = cache(
  async (tenantId: string, seats: number) =>
    (await queries.membershipInvites.countUnlockedSeatsInUse(tenantId)) > seats,
);
