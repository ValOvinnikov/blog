import { timestamp } from 'drizzle-orm/pg-core';

export const CREATED_AT_COLUMN = 'created_at';
const UPDATED_AT_COLUMN = 'updated_at';
export const EMAIL_ENCRYPTED_COLUMN = 'email_encrypted';
export const EMAIL_INDEX_COLUMN = 'email_index';
export const EMAIL_EXACT_INDEX_COLUMN = 'email_exact_index';
export const TIMESTAMP_WITH_TIME_ZONE = { withTimezone: true } as const;

export const timestampColumns = {
  createdAt: timestamp(CREATED_AT_COLUMN, { mode: 'date' })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp(UPDATED_AT_COLUMN, { mode: 'date' })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};
