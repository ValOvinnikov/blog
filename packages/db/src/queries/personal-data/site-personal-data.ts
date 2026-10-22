import type { TMaybeUndefined } from '@blog/config/types';
import { getDb } from '@blog/db/client';
import type { TMembershipRole } from '@blog/db/constants';
import { leads } from '@blog/db/schema/leads';
import { membershipInvites } from '@blog/db/schema/membership-invites';
import {
  subscribers,
  type TSubscriberStatus,
} from '@blog/db/schema/subscribers';
import { tenants } from '@blog/db/schema/tenants';
import { readPersonalValue } from '@blog/db/utils/personal-data/personal-data';
import { asc, eq } from 'drizzle-orm';

type TPersonalDataSite = {
  tenantId: string;
  tenantName: string;
};

export type TPersonalDataSubscriber = TPersonalDataSite & {
  id: string;
  email: string;
  status: TSubscriberStatus;
  subscribedAt: Date;
  confirmedAt: TMaybeUndefined<Date>;
};

export type TPersonalDataLead = TPersonalDataSite & {
  id: string;
  name: string;
  email: string;
  message: string;
  sourcePath: string;
  createdAt: Date;
};

export type TPersonalDataInvite = TPersonalDataSite & {
  id: string;
  email: string;
  role: TMembershipRole;
  createdAt: Date;
  consumedAt: TMaybeUndefined<Date>;
};

export type TSitePersonalData = {
  subscribers: TPersonalDataSubscriber[];
  leads: TPersonalDataLead[];
  membershipInvites: TPersonalDataInvite[];
};

const siteColumns = { tenantId: tenants.id, tenantName: tenants.name };

export async function findSitePersonalData(
  emailIndex: string,
): Promise<TSitePersonalData> {
  const db = getDb();

  const [subscriberRows, leadRows, inviteRows] = await Promise.all([
    db
      .select({ ...siteColumns, row: subscribers })
      .from(subscribers)
      .innerJoin(tenants, eq(tenants.id, subscribers.tenantId))
      .where(eq(subscribers.emailIndex, emailIndex))
      .orderBy(asc(tenants.name), asc(subscribers.subscribedAt)),
    db
      .select({ ...siteColumns, row: leads })
      .from(leads)
      .innerJoin(tenants, eq(tenants.id, leads.tenantId))
      .where(eq(leads.emailIndex, emailIndex))
      .orderBy(asc(tenants.name), asc(leads.createdAt)),
    db
      .select({ ...siteColumns, row: membershipInvites })
      .from(membershipInvites)
      .innerJoin(tenants, eq(tenants.id, membershipInvites.tenantId))
      .where(eq(membershipInvites.emailIndex, emailIndex))
      .orderBy(asc(tenants.name), asc(membershipInvites.createdAt)),
  ]);

  return {
    subscribers: subscriberRows.map(({ tenantId, tenantName, row }) => ({
      tenantId,
      tenantName,
      id: row.id,
      email: readPersonalValue(row.emailEncrypted, row.email),
      status: row.status,
      subscribedAt: row.subscribedAt,
      confirmedAt: row.confirmedAt ?? undefined,
    })),
    leads: leadRows.map(({ tenantId, tenantName, row }) => ({
      tenantId,
      tenantName,
      id: row.id,
      name: readPersonalValue(row.nameEncrypted, row.name),
      email: readPersonalValue(row.emailEncrypted, row.email),
      message: readPersonalValue(row.messageEncrypted, row.message),
      sourcePath: row.sourcePath,
      createdAt: row.createdAt,
    })),
    membershipInvites: inviteRows.map(({ tenantId, tenantName, row }) => ({
      tenantId,
      tenantName,
      id: row.id,
      email: readPersonalValue(row.emailEncrypted, row.email),
      role: row.role,
      createdAt: row.createdAt,
      consumedAt: row.consumedAt ?? undefined,
    })),
  };
}
