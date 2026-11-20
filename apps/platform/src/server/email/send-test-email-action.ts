'use server';

import { EMAIL_TEST_LOG } from '@platform/constants/email-test';
import { auth } from '@platform/server/auth/auth';
import { requireTenantManager } from '@platform/server/auth/require-tenant-manager';
import { findTestEmailSendRefusal } from '@platform/server/email/find-test-email-send-refusal';
import { loadTenantEmailBrand } from '@platform/server/email/load-tenant-email-brand';
import { resolveOperatorAlertFromAddress } from '@platform/server/email/resolve-operator-alert-from-address';
import {
  emailSenderInputSchema,
  emailTemplateCopyInputSchema,
  emailTemplateTypeSchema,
} from '@platform/utils/email-input-schemas/email-input-schemas';
import { buildEmailTemplatePreviewHtml } from '@platform/utils/email-template-preview-builder/email-template-preview-builder';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';
import {
  ACTION_OUTCOME,
  type TActionResult,
  type TOutcome,
} from '@shinefold/config';
import { EMAIL_ACCOUNT } from '@shinefold/config/constants';
import { queries } from '@shinefold/db';
import type { TEmailTemplateBlock } from '@shinefold/db/schema/email-templates';
import { applyTenantSenderName, sendEmail } from '@shinefold/email';
import { isNull } from '@shinefold/utils/primitives';
import { toOutcome } from '@shinefold/utils/to-outcome';
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
        typeof ACTION_OUTCOME.SERVER_ERROR,
        keyof TSendTestEmailInput
      >,
      TOutcome<typeof ACTION_OUTCOME.SUCCESS>
    >
  | { outcome: typeof ACTION_OUTCOME.RATE_LIMITED; retryAt: string }
  | { outcome: typeof ACTION_OUTCOME.SUCCESS; to: string };

const SERVER_ERROR = toOutcome(ACTION_OUTCOME.SERVER_ERROR);

export const sendTestEmailAction = async (
  tenantId: string,
  input: TSendTestEmailInput,
): Promise<TSendTestEmailResult> => {
  const parsed = sendTestEmailInputSchema.safeParse(input);
  if (
    !parsed.success ||
    isNull(parsed.data.copy.subject) ||
    isNull(parsed.data.copy.body)
  ) {
    return { outcome: ACTION_OUTCOME.INVALID, fieldErrors: {} };
  }

  const { tenant } = await requireTenantManager(tenantId);
  const session = await auth();
  const userId = session?.user?.id;
  const to = session?.user?.email;
  if (!userId || !to) return SERVER_ERROR;

  const { templateType, sender } = parsed.data;
  const subject = parsed.data.copy.subject;
  const body = parsed.data.copy.body as TEmailTemplateBlock[];

  try {
    const refusal = await findTestEmailSendRefusal(userId);
    if (refusal) {
      return {
        outcome: ACTION_OUTCOME.RATE_LIMITED,
        retryAt: refusal.retryAt.toISOString(),
      };
    }

    const [{ brand }, emailConfig, template, t] = await Promise.all([
      loadTenantEmailBrand(tenant.id),
      queries.emailConfig.getEmailConfig(tenant.id),
      queries.emailTemplates.getEmailTemplate(tenant.id, templateType),
      getTranslations('emailPreview'),
    ]);

    await sendEmail({
      account: EMAIL_ACCOUNT.PLATFORM,
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
    logger.error(EMAIL_TEST_LOG.SEND_FAILED, {
      tenantId: tenant.id,
      templateType,
      ...toLoggableError(error),
    });
    return SERVER_ERROR;
  }
};
