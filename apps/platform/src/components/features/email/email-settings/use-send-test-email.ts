'use client';

import type { TEmailTemplateType } from '@blog/config';
import type { TEmailTemplateBlock } from '@blog/db/schema/email-templates';
import { useToast } from '@platform/context/toast-provider';
import { sendTestEmailAction } from '@platform/server/email/send-test-email-action';
import {
  toSenderInput,
  type TEmailSenderDraft,
} from '@platform/utils/email-draft/email-draft';
import { useTranslations } from 'next-intl';
import { useTransition } from 'react';

type TTestEmail = {
  templateType: TEmailTemplateType;
  subject: string;
  body: TEmailTemplateBlock[];
  sender: TEmailSenderDraft;
};

const FAILURE_MESSAGE_KEYS = {
  invalid: 'testInvalid',
  'rate-limited': 'testRateLimited',
  failed: 'testFailed',
} as const;

export const useSendTestEmail = (tenantId: string) => {
  const t = useTranslations('emailPreview');
  const toast = useToast();
  const [isSending, startTransition] = useTransition();

  const sendTest = ({ templateType, subject, body, sender }: TTestEmail) =>
    startTransition(async () => {
      const result = await sendTestEmailAction(tenantId, {
        templateType,
        copy: { subject, body },
        sender: toSenderInput(sender),
      });
      if (result.ok) {
        toast.success({ message: t('testSent', { email: result.to }) });
      } else {
        toast.error({ message: t(FAILURE_MESSAGE_KEYS[result.reason]) });
      }
    });

  return { sendTest, isSending };
};
