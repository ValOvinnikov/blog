import type { TOAuthProvider } from '@blog/config/constants';
import {
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

import { CREATED_AT_COLUMN, UPDATED_AT_COLUMN } from './columns';
import { tenants } from './tenants';

export const tenantOAuthCredentials = pgTable(
  'tenant_oauth_credentials',
  {
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    provider: text('provider').$type<TOAuthProvider>().notNull(),
    clientId: text('client_id').notNull(),
    clientSecretEncrypted: text('client_secret_encrypted').notNull(),
    callbackDomain: text('callback_domain'),
    createdAt: timestamp(CREATED_AT_COLUMN, { mode: 'date' })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp(UPDATED_AT_COLUMN, { mode: 'date' })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (credentials) => [
    primaryKey({ columns: [credentials.tenantId, credentials.provider] }),
  ],
);

export type TTenantOAuthCredentials =
  typeof tenantOAuthCredentials.$inferSelect;
