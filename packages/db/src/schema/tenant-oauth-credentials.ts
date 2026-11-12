import type { TOAuthProvider } from '@blog/config/constants';
import { pgTable, primaryKey, text, uuid } from 'drizzle-orm/pg-core';

import { timestampColumns } from './columns';
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
    ...timestampColumns,
  },
  (credentials) => [
    primaryKey({ columns: [credentials.tenantId, credentials.provider] }),
  ],
);

export type TTenantOAuthCredentials =
  typeof tenantOAuthCredentials.$inferSelect;
