import type { TMaybeUndefined } from '@blog/config';
import { getDb } from '@blog/db/client';
import { emailConfig, type TEmailConfig } from '@blog/db/schema/email-config';
import { eq } from 'drizzle-orm';

export type TEmailConfigResult = Omit<
  TEmailConfig,
  | 'logoAssetUrl'
  | 'senderName'
  | 'replyToAddress'
  | 'footerPostalAddress'
  | 'contactRecipient'
> & {
  logoAssetUrl: TMaybeUndefined<string>;
  senderName: TMaybeUndefined<string>;
  replyToAddress: TMaybeUndefined<string>;
  footerPostalAddress: TMaybeUndefined<string>;
  contactRecipient: TMaybeUndefined<string>;
};

export function toEmailConfigResult(row: TEmailConfig): TEmailConfigResult {
  return {
    ...row,
    logoAssetUrl: row.logoAssetUrl ?? undefined,
    senderName: row.senderName ?? undefined,
    replyToAddress: row.replyToAddress ?? undefined,
    footerPostalAddress: row.footerPostalAddress ?? undefined,
    contactRecipient: row.contactRecipient ?? undefined,
  };
}

export async function getEmailConfig(
  tenantId: string,
): Promise<TEmailConfigResult | undefined> {
  const db = getDb();

  const [row] = await db
    .select()
    .from(emailConfig)
    .where(eq(emailConfig.tenantId, tenantId));

  if (!row) return undefined;

  return toEmailConfigResult(row);
}
