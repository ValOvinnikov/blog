import { users } from '@blog/db/schema/auth';
import { leads } from '@blog/db/schema/leads';
import { membershipInvites } from '@blog/db/schema/membership-invites';
import { subscribers } from '@blog/db/schema/subscribers';
import { accountEmailIndex, personalDataIndex } from '@blog/utils/encryption';
import { type SQL, sql } from 'drizzle-orm';
import type { AnyPgColumn, PgTable } from 'drizzle-orm/pg-core';

interface IEmailIndexField {
  column: AnyPgColumn;
  indexer: (email: string, keyBase64: string) => string;
}

export interface IPersonalDataField {
  plain: AnyPgColumn;
  encrypted: AnyPgColumn;
  emailIndex?: IEmailIndexField;
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
        emailIndex: { column: users.emailIndex, indexer: accountEmailIndex },
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
        emailIndex: {
          column: subscribers.emailIndex,
          indexer: personalDataIndex,
        },
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
        emailIndex: {
          column: membershipInvites.emailIndex,
          indexer: personalDataIndex,
        },
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
        emailIndex: { column: leads.emailIndex, indexer: personalDataIndex },
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
    ? sql`(${encrypted} is null or ${emailIndex.column} is null)`
    : sql`${encrypted} is null`;

  return sql`(${plain} <> '' and ${missing})`;
}

export function targetGap({ fields }: IPersonalDataTarget): SQL {
  return sql`(${sql.join(fields.map(fieldGap), sql` or `)})`;
}
