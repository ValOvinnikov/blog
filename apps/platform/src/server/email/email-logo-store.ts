import 'server-only';

import { queries } from '@blog/db';
import type { TEmailLogoTarget } from '@platform/utils/email-logo-target/email-logo-target';

export const getEmailLogoUrl = async (
  tenantId: string,
  target: TEmailLogoTarget,
): Promise<string | undefined> => {
  if (target.type === 'tenant') {
    const config = await queries.emailConfig.getEmailConfig(tenantId);
    return config?.logoAssetUrl;
  }

  const template = await queries.emailTemplates.getEmailTemplate(
    tenantId,
    target.templateType,
  );
  return template.logoAssetUrl;
};

export const setEmailLogoUrl = async (
  tenantId: string,
  target: TEmailLogoTarget,
  url: string | null,
): Promise<void> => {
  if (target.type === 'tenant') {
    await queries.emailConfig.upsertEmailConfig(tenantId, {
      logoAssetUrl: url,
    });
    return;
  }

  await queries.emailTemplates.upsertEmailTemplate(
    tenantId,
    target.templateType,
    { logoAssetUrl: url },
  );
};
