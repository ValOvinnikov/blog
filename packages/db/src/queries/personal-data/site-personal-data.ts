import { getDb } from '@blog/db/client';
import { readLeadContent } from '@blog/db/queries/leads/lead-content';
import type { TSitePersonalData } from '@blog/db/queries/personal-data/site-personal-data-types';
import { leads } from '@blog/db/schema/leads';
import { membershipInvites } from '@blog/db/schema/membership-invites';
import { subscribers } from '@blog/db/schema/subscribers';
import { tenants } from '@blog/db/schema/tenants';
import { decryptPersonalValue } from '@blog/db/utils/personal-data/personal-data';
import { asc, eq } from 'drizzle-orm';

const siteColumns = { tenantId: tenants.id, tenantName: tenants.name };

export async function findSitePersonalData(
  emailIndex: string,
): Promise<TSitePersonalData> {
  const db = getDb();

  const [subscriberRows, leadRows, inviteRows] = await Promise.all([
    db
      .select({
        ...siteColumns,
        id: subscribers.id,
        emailEncrypted: subscribers.emailEncrypted,
        status: subscribers.status,
        subscribedAt: subscribers.subscribedAt,
        confirmedAt: subscribers.confirmedAt,
      })
      .from(subscribers)
      .innerJoin(tenants, eq(tenants.id, subscribers.tenantId))
      .where(eq(subscribers.emailIndex, emailIndex))
      .orderBy(asc(tenants.name), asc(subscribers.subscribedAt)),
    db
      .select({
        ...siteColumns,
        id: leads.id,
        nameEncrypted: leads.nameEncrypted,
        emailEncrypted: leads.emailEncrypted,
        messageEncrypted: leads.messageEncrypted,
        sourcePath: leads.sourcePath,
        createdAt: leads.createdAt,
      })
      .from(leads)
      .innerJoin(tenants, eq(tenants.id, leads.tenantId))
      .where(eq(leads.emailIndex, emailIndex))
      .orderBy(asc(tenants.name), asc(leads.createdAt)),
    db
      .select({
        ...siteColumns,
        id: membershipInvites.id,
        emailEncrypted: membershipInvites.emailEncrypted,
        role: membershipInvites.role,
        createdAt: membershipInvites.createdAt,
        consumedAt: membershipInvites.consumedAt,
      })
      .from(membershipInvites)
      .innerJoin(tenants, eq(tenants.id, membershipInvites.tenantId))
      .where(eq(membershipInvites.emailIndex, emailIndex))
      .orderBy(asc(tenants.name), asc(membershipInvites.createdAt)),
  ]);

  return {
    subscribers: subscriberRows.map(
      ({ emailEncrypted, confirmedAt, ...subscriber }) => ({
        ...subscriber,
        email: decryptPersonalValue(emailEncrypted),
        confirmedAt: confirmedAt ?? undefined,
      }),
    ),
    leads: leadRows.map(
      ({ nameEncrypted, emailEncrypted, messageEncrypted, ...lead }) => ({
        ...lead,
        ...readLeadContent({ nameEncrypted, emailEncrypted, messageEncrypted }),
      }),
    ),
    membershipInvites: inviteRows.map(
      ({ emailEncrypted, consumedAt, ...invite }) => ({
        ...invite,
        email: decryptPersonalValue(emailEncrypted),
        consumedAt: consumedAt ?? undefined,
      }),
    ),
  };
}
