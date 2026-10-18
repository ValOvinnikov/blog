'use client';

import { ACTION_OUTCOME, type TEmailTemplateType } from '@blog/config';
import type { TEmailTemplateBlock } from '@blog/db/schema/email-templates';
import { useToast } from '@platform/context/toast-provider';
import {
  sendTestEmailAction,
  type TSendTestEmailResult,
} from '@platform/server/email/send-test-email-action';
import {
  toTestSenderInput,
  type TEmailSenderDraft,
} from '@platform/utils/email-draft/email-draft';
import { useTranslations } from 'next-intl';
import { useTransition } from 'react';

export type TTestEmail = {
  templateType: TEmailTemplateType;
  subject: string;
  body: TEmailTemplateBlock[];
  sender: TEmailSenderDraft;
};

const FAILURE_MESSAGE_KEYS = {
  [ACTION_OUTCOME.INVALID]: 'testInvalid',
  [ACTION_OUTCOME.RATE_LIMITED]: 'testRateLimited',
  [ACTION_OUTCOME.SERVER_ERROR]: 'testFailed',
} satisfies Record<
  Exclude<TSendTestEmailResult['outcome'], typeof ACTION_OUTCOME.SUCCESS>,
  string
>;

export const useSendTestEmail = (tenantId: string) => {
  const t = useTranslations('emailPreview');
  const toast = useToast();
  const [isSending, startTransition] = useTransition();

  const sendTest = ({ templateType, subject, body, sender }: TTestEmail) =>
    startTransition(async () => {
      const result = await sendTestEmailAction(tenantId, {
        templateType,
        copy: { subject, body },
        sender: toTestSenderInput(sender),
      });
      if (result.outcome === ACTION_OUTCOME.SUCCESS) {
        toast.success({ message: t('testSent', { email: result.to }) });
      } else {
        toast.error({ message: t(FAILURE_MESSAGE_KEYS[result.outcome]) });
      }
    });

  return { sendTest, isSending };
};
