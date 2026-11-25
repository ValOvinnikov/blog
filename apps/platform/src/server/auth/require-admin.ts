import 'server-only';

import { queries } from '@shinefold/db';
import type { TAdmin } from '@shinefold/db/schema/admins';
import { notFound } from 'next/navigation';
import { cache } from 'react';

import { requireSessionUserId } from './require-session-user-id';

/** Refuses a caller with no `admins` row as a 404, so an entitlement denial is indistinguishable from a missing route. */
export const requireAdmin = cache(async (): Promise<TAdmin> => {
  const userId = await requireSessionUserId();
  const admin = await queries.admins.getAdminByUserId(userId);

  if (!admin) {
    notFound();
  }

  return admin;
});
