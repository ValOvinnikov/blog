import { getDb } from '@blog/db/client';
import { EMAIL_NEW_POSTS_DEFAULT } from '@blog/db/constants';
import { emailConfig } from '@blog/db/schema/email-config';
import { eq } from 'drizzle-orm';

export async function getEmailNewPosts(tenantId: string): Promise<boolean> {
  const [row] = await getDb()
    .select({ emailNewPosts: emailConfig.emailNewPosts })
    .from(emailConfig)
    .where(eq(emailConfig.tenantId, tenantId));

  return row?.emailNewPosts ?? EMAIL_NEW_POSTS_DEFAULT;
}
