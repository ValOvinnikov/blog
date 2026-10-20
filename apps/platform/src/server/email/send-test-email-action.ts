'use server';

import { applyTenantSenderName } from '@blog/auth/providers/magic-link/apply-tenant-sender-name/apply-tenant-sender-name';
import {
  ACTION_OUTCOME,
  type TActionResult,
  type TOutcome,
} from '@blog/config';
import { queries } from '@blog/db';
import type { TEmailTemplateBlock } from '@blog/db/schema/email-templates';
import { sendEmail } from '@blog/email';
import { toOutcome } from '@blog/utils/to-outcome';
import { auth } from '@platform/server/auth/auth';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import { loadTenantEmailBrand } from '@platform/server/email/load-tenant-email-brand';
import { resolveOperatorAlertFromAddress } from '@platform/server/email/resolve-operator-alert-from-address';
import { takeTestEmailSend } from '@platform/server/email/test-email-rate-limit';
import {
  emailSenderInputSchema,
  emailTemplateCopyInputSchema,
  emailTemplateTypeSchema,
} from '@platform/utils/email-input-schemas/email-input-schemas';
import { buildEmailTemplatePreviewHtml } from '@platform/utils/email-template-preview-builder/email-template-preview-builder';
import { logger } from '@platform/utils/logger/logger';
import { getTranslations } from 'next-intl/server';
import { z } from 'zod';

const sendTestEmailInputSchema = z.object({
  templateType: emailTemplateTypeSchema,
  copy: emailTemplateCopyInputSchema,
  sender: emailSenderInputSchema.omit({ contactRecipient: true }),
});

export type TSendTestEmailInput = z.input<typeof sendTestEmailInputSchema>;
export type TSendTestEmailResult =
  | Exclude<
      TActionResult<
        typeof ACTION_OUTCOME.RATE_LIMITED | typeof ACTION_OUTCOME.SERVER_ERROR,
        keyof TSendTestEmailInput
      >,
      TOutcome<typeof ACTION_OUTCOME.SUCCESS>
    >
  | { outcome: typeof ACTION_OUTCOME.SUCCESS; to: string };

const SERVER_ERROR = toOutcome(ACTION_OUTCOME.SERVER_ERROR);

export const sendTestEmailAction = async (
  tenantId: string,
  input: TSendTestEmailInput,
): Promise<TSendTestEmailResult> => {
  const parsed = sendTestEmailInputSchema.safeParse(input);
  if (
    !parsed.success ||
    parsed.data.copy.subject === null ||
    parsed.data.copy.body === null
  ) {
    return { outcome: ACTION_OUTCOME.INVALID, fieldErrors: {} };
  }

  const { tenant } = await requireTenantMembership(tenantId);
  const session = await auth();
  const userId = session?.user?.id;
  const to = session?.user?.email;
  if (!userId || !to) return SERVER_ERROR;

  if (!takeTestEmailSend(userId)) {
    return toOutcome(ACTION_OUTCOME.RATE_LIMITED);
  }

  const { templateType, sender } = parsed.data;
  const subject = parsed.data.copy.subject;
  const body = parsed.data.copy.body as TEmailTemplateBlock[];

  try {
    const [brand, emailConfig, template, t] = await Promise.all([
      loadTenantEmailBrand(tenant.id),
      queries.emailConfig.getEmailConfig(tenant.id),
      queries.emailTemplates.getEmailTemplate(tenant.id, templateType),
      getTranslations('emailPreview'),
    ]);

    await sendEmail({
      to,
      from: applyTenantSenderName(
        resolveOperatorAlertFromAddress(),
        sender.senderName ?? undefined,
      ),
      subject: t('testSubject', { subject }),
      html: buildEmailTemplatePreviewHtml(templateType, {
        subject,
        body,
        brand,
        brandName: tenant.name,
        logoImageUrl: template.logoAssetUrl ?? emailConfig?.logoAssetUrl,
        footerPostalAddress: sender.footerPostalAddress ?? undefined,
      }),
      replyTo: sender.replyToAddress ?? undefined,
    });

    return { outcome: ACTION_OUTCOME.SUCCESS, to };
  } catch (error) {
    logger.error('email_test.send_failed', {
      tenantId: tenant.id,
      templateType,
      error,
    });
    return SERVER_ERROR;
  }
};
