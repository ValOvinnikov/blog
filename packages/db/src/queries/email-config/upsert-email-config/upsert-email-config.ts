import { FOOTER_ADDRESS_MAX, SENDER_NAME_MAX } from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import { emailConfig } from '@blog/db/schema/email-config';
import { isUndefined } from '@blog/utils/primitives';
import { z } from 'zod';

import {
  toEmailConfigResult,
  type TEmailConfigResult,
} from '../get-email-config';

// A field absent from the input is left untouched on `UPDATE` (and falls
// back to no value on the first `INSERT` for a tenant) — each field saves
// independently. An explicit `null` clears a previously-set value; that is
// distinct from omission, which `undefined` alone can't express once a
// value has already been set.
export const updateEmailConfigInputSchema = z.object({
  logoAssetUrl: z.string().trim().url().nullable().optional(),
  senderName: z
    .string()
    .trim()
    .min(1)
    .max(SENDER_NAME_MAX)
    .nullable()
    .optional(),
  replyToAddress: z.string().trim().email().nullable().optional(),
  footerPostalAddress: z
    .string()
    .trim()
    .min(1)
    .max(FOOTER_ADDRESS_MAX)
    .nullable()
    .optional(),
  contactRecipient: z.string().trim().email().nullable().optional(),
});

export type TUpdateEmailConfigInput = z.input<
  typeof updateEmailConfigInputSchema
>;

type TEmailConfigWritable = Partial<typeof emailConfig.$inferInsert>;

function presentFields(
  parsed: z.output<typeof updateEmailConfigInputSchema>,
): TEmailConfigWritable {
  const fields: TEmailConfigWritable = {};

  if (!isUndefined(parsed.logoAssetUrl))
    fields.logoAssetUrl = parsed.logoAssetUrl;
  if (!isUndefined(parsed.senderName)) fields.senderName = parsed.senderName;
  if (!isUndefined(parsed.replyToAddress)) {
    fields.replyToAddress = parsed.replyToAddress;
  }
  if (!isUndefined(parsed.footerPostalAddress)) {
    fields.footerPostalAddress = parsed.footerPostalAddress;
  }
  if (!isUndefined(parsed.contactRecipient)) {
    fields.contactRecipient = parsed.contactRecipient;
  }

  return fields;
}

export async function upsertEmailConfig(
  tenantId: string,
  input: TUpdateEmailConfigInput,
): Promise<TEmailConfigResult> {
  const db = getDb();
  const parsed = updateEmailConfigInputSchema.parse(input);
  const fields = presentFields(parsed);

  const [row] = await db
    .insert(emailConfig)
    .values({ tenantId, ...fields })
    .onConflictDoUpdate({
      target: emailConfig.tenantId,
      set: { ...fields, updatedAt: new Date() },
    })
    .returning();

  if (!row) {
    throw new Error(
      `upsertEmailConfig: upsert for tenant "${tenantId}" returned no row.`,
    );
  }

  return toEmailConfigResult(row);
}
