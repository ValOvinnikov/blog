import { users } from '@blog/db/schema/auth';
import { leads } from '@blog/db/schema/leads';
import { membershipInvites } from '@blog/db/schema/membership-invites';
import { subscribers } from '@blog/db/schema/subscribers';
import { type SQL, sql } from 'drizzle-orm';
import type { AnyPgColumn, PgTable } from 'drizzle-orm/pg-core';

export interface IPersonalDataField {
  plain: AnyPgColumn;
  encrypted: AnyPgColumn;
  emailIndex?: AnyPgColumn;
}

export interface IPersonalDataTarget {
  table: PgTable;
  id: AnyPgColumn;
  fields: IPersonalDataField[];
}

export const PERSONAL_DATA_TARGETS: IPersonalDataTarget[] = [
  {
    table: users,
    id: users.id,
    fields: [
      { plain: users.name, encrypted: users.nameEncrypted },
      {
        plain: users.email,
        encrypted: users.emailEncrypted,
        emailIndex: users.emailIndex,
      },
    ],
  },
  {
    table: subscribers,
    id: subscribers.id,
    fields: [
      {
        plain: subscribers.email,
        encrypted: subscribers.emailEncrypted,
        emailIndex: subscribers.emailIndex,
      },
    ],
  },
  {
    table: membershipInvites,
    id: membershipInvites.id,
    fields: [
      {
        plain: membershipInvites.email,
        encrypted: membershipInvites.emailEncrypted,
        emailIndex: membershipInvites.emailIndex,
      },
    ],
  },
  {
    table: leads,
    id: leads.id,
    fields: [
      { plain: leads.name, encrypted: leads.nameEncrypted },
      {
        plain: leads.email,
        encrypted: leads.emailEncrypted,
        emailIndex: leads.emailIndex,
      },
      { plain: leads.message, encrypted: leads.messageEncrypted },
    ],
  },
];

export function fieldGap({
  plain,
  encrypted,
  emailIndex,
}: IPersonalDataField): SQL {
  const missing = emailIndex
    ? sql`(${encrypted} is null or ${emailIndex} is null)`
    : sql`${encrypted} is null`;

  return sql`(${plain} <> '' and ${missing})`;
}

export function targetGap({ fields }: IPersonalDataTarget): SQL {
  return sql`(${sql.join(fields.map(fieldGap), sql` or `)})`;
}
