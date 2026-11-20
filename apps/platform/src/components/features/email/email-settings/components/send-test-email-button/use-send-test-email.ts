'use client';

import { useToast } from '@platform/context/toast-provider';
import {
  sendTestEmailAction,
  type TSendTestEmailResult,
} from '@platform/server/email/send-test-email-action';
import {
  toTestSenderInput,
  type TEmailSenderDraft,
} from '@platform/utils/email-draft/email-draft';
import { formatLocalMoment } from '@platform/utils/format-local-moment/format-local-moment';
import { settleAction } from '@platform/utils/settle-action/settle-action';
import {
  ACTION_OUTCOME,
  isOutcomeRateLimited,
  isOutcomeSuccess,
  type TEmailTemplateType,
} from '@shinefold/config';
import type { TEmailTemplateBlock } from '@shinefold/db/schema/email-templates';
import { useLocale, useTranslations } from 'next-intl';
import { useTransition } from 'react';

export type TTestEmail = {
  templateType: TEmailTemplateType;
  subject: string;
  body: TEmailTemplateBlock[];
  sender: TEmailSenderDraft;
};

const FAILURE_MESSAGE_KEYS = {
  [ACTION_OUTCOME.INVALID]: 'testInvalid',
  [ACTION_OUTCOME.SERVER_ERROR]: 'testFailed',
} satisfies Record<
  Exclude<
    TSendTestEmailResult['outcome'],
    typeof ACTION_OUTCOME.SUCCESS | typeof ACTION_OUTCOME.RATE_LIMITED
  >,
  string
>;

export const useSendTestEmail = (tenantId: string) => {
  const t = useTranslations('emailPreview');
  const locale = useLocale();
  const toast = useToast();
  const [isSending, startTransition] = useTransition();

  const sendTest = ({ templateType, subject, body, sender }: TTestEmail) =>
    startTransition(async () => {
      const result = await settleAction(
        sendTestEmailAction(tenantId, {
          templateType,
          copy: { subject, body },
          sender: toTestSenderInput(sender),
        }),
      );
      if (isOutcomeSuccess(result)) {
        toast.success({ message: t('testSent', { email: result.to }) });
      } else if (isOutcomeRateLimited(result)) {
        const { text: time } = formatLocalMoment(
          new Date(result.retryAt),
          new Date(),
          locale,
        );
        toast.error({ message: t('testRateLimited', { time }) });
      } else {
        toast.error({ message: t(FAILURE_MESSAGE_KEYS[result.outcome]) });
      }
    });

  return { sendTest, isSending };
};
