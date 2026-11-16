import {
  EMAIL_TEMPLATE_TYPE,
  type TEmailTemplateType,
} from '@shinefold/config/constants';
import type { TMaybeUndefined } from '@shinefold/config/types';
import { getDb } from '@shinefold/db/client';
import { emailTemplateLogos } from '@shinefold/db/schema/email-templates';
import { eq } from 'drizzle-orm';

export type TEmailTemplateLogoUrls = Record<
  TEmailTemplateType,
  TMaybeUndefined<string>
>;

export async function listEmailTemplateLogoUrls(
  tenantId: string,
): Promise<TEmailTemplateLogoUrls> {
  const logos = await getDb()
    .select({
      templateType: emailTemplateLogos.templateType,
      logoAssetUrl: emailTemplateLogos.logoAssetUrl,
    })
    .from(emailTemplateLogos)
    .where(eq(emailTemplateLogos.tenantId, tenantId));

  return Object.fromEntries(
    Object.values(EMAIL_TEMPLATE_TYPE).map((templateType) => [
      templateType,
      logos.find((logo) => logo.templateType === templateType)?.logoAssetUrl,
    ]),
  ) as TEmailTemplateLogoUrls;
}
