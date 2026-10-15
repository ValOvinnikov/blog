import type {
  TEmailDraft,
  TEmailSenderDraft,
} from '@platform/utils/email-draft/email-draft';
import { useTranslations } from 'next-intl';
import { useId } from 'react';

const SENDER_FIELD_LABEL_KEYS = {
  senderName: 'senderNameLabel',
  replyToAddress: 'replyToLabel',
  footerPostalAddress: 'footerAddressLabel',
  contactRecipient: 'contactRecipientLabel',
} as const satisfies Record<keyof TEmailSenderDraft, string>;

export const useSenderFields = () => {
  const t = useTranslations('emailSettingsForm');
  const senderFieldIds = { senderName: useId(), contactRecipient: useId() };

  const senderDraftFields = (
    Object.keys(SENDER_FIELD_LABEL_KEYS) as (keyof TEmailSenderDraft)[]
  ).map((field) => ({
    id: field,
    label: t(SENDER_FIELD_LABEL_KEYS[field]),
    display: (values: TEmailDraft) => values.sender[field],
  }));

  return { senderFieldIds, senderDraftFields };
};
