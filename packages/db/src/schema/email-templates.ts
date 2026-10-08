import type { TEmailTemplateType } from '@blog/config/constants';
import {
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

import { localeCodeEnum, tenants } from './tenants';

// A Portable Text block, typed loosely on purpose — this package never
// interprets its contents (the email-HTML serializer that does lives in
// `@blog/email`), it only stores and returns whatever shape was authored.
export type TEmailTemplateBlock = {
  _type: string;
  _key: string;
  [key: string]: unknown;
};

// One row per (tenant, template type, language). `subject`/`body` are
// nullable: an absent field falls back through the tenant's default language
// to the product default in the requested language (see `getEmailTemplate`).
export const emailTemplates = pgTable(
  'email_templates',
  {
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    templateType: text('template_type').notNull().$type<TEmailTemplateType>(),
    locale: localeCodeEnum('locale').notNull(),
    subject: text('subject'),
    body: jsonb('body').$type<TEmailTemplateBlock[]>(),
    logoAssetUrl: text('logo_asset_url'),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (emailTemplate) => [
    primaryKey({
      columns: [
        emailTemplate.tenantId,
        emailTemplate.templateType,
        emailTemplate.locale,
      ],
    }),
  ],
);

export type TEmailTemplateRow = typeof emailTemplates.$inferSelect;
