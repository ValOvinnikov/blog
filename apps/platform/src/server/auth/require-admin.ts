import 'server-only';

import { queries } from '@blog/db';
import type { TAdmin } from '@blog/db/schema/admins';
import { notFound } from 'next/navigation';
import { cache } from 'react';

import { requireSessionUserId } from './require-session-user-id';

/**
 * The Platform-section gate: no session redirects to sign-in, a session with
 * no `admins` row 404s — an entitlement denial must be indistinguishable
 * from the route not existing. Called from a layout (not a page) so every
 * route nested under a gated segment is protected by existing there, never
 * by a per-page check someone could forget to add.
 *
 * Also the floor for tenant actions that only edit in-app state (creating or
 * updating a tenant's details) — any admin role can reverse those. Actions
 * that are irreversible or reach outside this app require `requireSuperAdmin`.
 */
export const requireAdmin = cache(async (): Promise<TAdmin> => {
  const userId = await requireSessionUserId();
  const admin = await queries.admins.getAdminByUserId(userId);

  if (!admin) {
    notFound();
  }

  return admin;
});
