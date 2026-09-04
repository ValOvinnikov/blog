import type { TEmailTemplateType } from '@blog/config/constants';
import {
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

import { tenants } from './tenants';

// A Portable Text block, typed loosely on purpose — this package never
// interprets its contents (the email-HTML serializer that does lives in
// `@blog/email`), it only stores and returns whatever shape was authored.
export type TPortableTextBlock = {
  _type: string;
  _key: string;
  [key: string]: unknown;
};

// A tenant's authored copy for one template type, one row per (tenant,
// template type) pair. `subject`/`body` are nullable rather than required:
// a row can be fully seeded with product defaults, hold only a subset of
// fields a tenant has actually edited, or not exist at all for a template
// type introduced after the tenant was provisioned — the read path merges
// whatever is present here over product defaults, per field (see
// `getEmailTemplate`). `logoAssetUrl` has no such fallback in this table;
// its own resolution ladder (per-template logo, then the tenant's email
// logo, then a product default) is resolved by the caller, not stored here.
export const emailTemplates = pgTable(
  'email_templates',
  {
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    templateType: text('template_type').notNull().$type<TEmailTemplateType>(),
    subject: text('subject'),
    body: jsonb('body').$type<TPortableTextBlock[]>(),
    logoAssetUrl: text('logo_asset_url'),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (emailTemplate) => [
    primaryKey({
      columns: [emailTemplate.tenantId, emailTemplate.templateType],
    }),
  ],
);

export type TEmailTemplateRow = typeof emailTemplates.$inferSelect;
