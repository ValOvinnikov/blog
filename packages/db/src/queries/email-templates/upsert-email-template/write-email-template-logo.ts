import type { TEmailTemplateType } from '@blog/config/constants';
import type { TMaybeNull } from '@blog/config/types';
import { getDb } from '@blog/db/client';
import { emailTemplateLogos } from '@blog/db/schema/email-templates';
import { isNull } from '@blog/utils/primitives';
import { and, eq } from 'drizzle-orm';

export async function writeEmailTemplateLogo(
  tenantId: string,
  templateType: TEmailTemplateType,
  logoAssetUrl: TMaybeNull<string>,
): Promise<void> {
  const db = getDb();

  if (isNull(logoAssetUrl)) {
    await db
      .delete(emailTemplateLogos)
      .where(
        and(
          eq(emailTemplateLogos.tenantId, tenantId),
          eq(emailTemplateLogos.templateType, templateType),
        ),
      );
    return;
  }

  await db
    .insert(emailTemplateLogos)
    .values({ tenantId, templateType, logoAssetUrl })
    .onConflictDoUpdate({
      target: [emailTemplateLogos.tenantId, emailTemplateLogos.templateType],
      set: { logoAssetUrl, updatedAt: new Date() },
    });
}
