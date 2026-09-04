import { getDb } from '@blog/db/client';
import { emailConfig, type TEmailConfig } from '@blog/db/schema/email-config';
import { eq } from 'drizzle-orm';

// `logoAssetUrl`/`senderName`/`replyToAddress`/`footerPostalAddress` are
// Postgres `null` when unset; mapped to `undefined` here so callers never
// have to reason about two different "absent" representations.
export type TEmailConfigResult = Omit<
  TEmailConfig,
  'logoAssetUrl' | 'senderName' | 'replyToAddress' | 'footerPostalAddress'
> & {
  logoAssetUrl: string | undefined;
  senderName: string | undefined;
  replyToAddress: string | undefined;
  footerPostalAddress: string | undefined;
};

export function toEmailConfigResult(row: TEmailConfig): TEmailConfigResult {
  return {
    ...row,
    logoAssetUrl: row.logoAssetUrl ?? undefined,
    senderName: row.senderName ?? undefined,
    replyToAddress: row.replyToAddress ?? undefined,
    footerPostalAddress: row.footerPostalAddress ?? undefined,
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
