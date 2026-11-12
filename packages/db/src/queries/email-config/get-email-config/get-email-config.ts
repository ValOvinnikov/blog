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
  | 'newsletterPausedAt'
> & {
  logoAssetUrl: TMaybeUndefined<string>;
  senderName: TMaybeUndefined<string>;
  replyToAddress: TMaybeUndefined<string>;
  footerPostalAddress: TMaybeUndefined<string>;
  contactRecipient: TMaybeUndefined<string>;
};

export function toEmailConfigResult({
  id,
  tenantId,
  emailNewPosts,
  createdAt,
  updatedAt,
  logoAssetUrl,
  senderName,
  replyToAddress,
  footerPostalAddress,
  contactRecipient,
}: TEmailConfig): TEmailConfigResult {
  return {
    id,
    tenantId,
    emailNewPosts,
    createdAt,
    updatedAt,
    logoAssetUrl: logoAssetUrl ?? undefined,
    senderName: senderName ?? undefined,
    replyToAddress: replyToAddress ?? undefined,
    footerPostalAddress: footerPostalAddress ?? undefined,
    contactRecipient: contactRecipient ?? undefined,
  };
}

export async function getEmailConfig(
  tenantId: string,
): Promise<TMaybeUndefined<TEmailConfigResult>> {
  const db = getDb();

  const [row] = await db
    .select()
    .from(emailConfig)
    .where(eq(emailConfig.tenantId, tenantId));

  if (!row) return undefined;

  return toEmailConfigResult(row);
}
