import type { TAuditTargetType } from '@blog/config/constants';
import type { TMaybeNull } from '@blog/config/types';
import { getDb } from '@blog/db/client';
import { PERSONAL_DATA_OWNER } from '@blog/db/constants';
import { auditEvents, type TAuditEvent } from '@blog/db/schema/audit-events';
import { users } from '@blog/db/schema/auth';
import {
  readOptionalPersonalValue,
  reportPlainPersonalRead,
} from '@blog/db/utils/personal-data/personal-data';
import { isNull } from '@blog/utils/primitives';
import { and, desc, eq } from 'drizzle-orm';

export type TListAuditEventsForTargetOptions = {
  limit?: number;
  offset?: number;
};

export type TListedAuditEvent = Omit<TAuditEvent, 'actorEmail'> & {
  actorAccountEmail: TMaybeNull<string>;
};

export async function listAuditEventsForTarget(
  targetType: TAuditTargetType,
  targetId: string,
  options: TListAuditEventsForTargetOptions = {},
): Promise<TListedAuditEvent[]> {
  const db = getDb();

  const rows = await db
    .select({
      id: auditEvents.id,
      actorId: auditEvents.actorId,
      action: auditEvents.action,
      targetType: auditEvents.targetType,
      targetId: auditEvents.targetId,
      details: auditEvents.details,
      createdAt: auditEvents.createdAt,
      accountId: users.id,
      accountEmail: users.email,
      accountEmailEncrypted: users.emailEncrypted,
    })
    .from(auditEvents)
    .leftJoin(users, eq(users.id, auditEvents.actorId))
    .where(
      and(
        eq(auditEvents.targetType, targetType),
        eq(auditEvents.targetId, targetId),
      ),
    )
    .orderBy(desc(auditEvents.createdAt), desc(auditEvents.id))
    .limit(options.limit ?? 20)
    .offset(Math.max(options.offset ?? 0, 0));

  return rows.map(
    ({ accountId, accountEmail, accountEmailEncrypted, ...event }) => {
      if (isNull(accountId)) return { ...event, actorAccountEmail: null };

      reportPlainPersonalRead(PERSONAL_DATA_OWNER.USER, accountEmailEncrypted);
      return {
        ...event,
        actorAccountEmail: readOptionalPersonalValue(
          accountEmailEncrypted,
          accountEmail,
        ),
      };
    },
  );
}
