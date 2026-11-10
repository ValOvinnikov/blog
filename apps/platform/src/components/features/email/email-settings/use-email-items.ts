import type { TLocaleIsoCode } from '@blog/config';
import {
  EMAIL_SENDER_ITEM,
  EMAIL_TEMPLATE_TYPES,
  type TEmailDraft,
} from '@platform/utils/email-draft/email-draft';
import { resolveItemStatus } from '@platform/utils/email-draft-changes/email-draft-changes';
import { useTranslations } from 'next-intl';

type TUseEmailItemsArgs = {
  saved: TEmailDraft;
  draft: TEmailDraft;
  locale: TLocaleIsoCode;
};

export const useEmailItems = ({ saved, draft, locale }: TUseEmailItemsArgs) => {
  const t = useTranslations('emailForm');
  const tStatus = useTranslations('fieldStatus');
  const tTemplate = useTranslations('emailTemplateEditor');

  return [EMAIL_SENDER_ITEM, ...EMAIL_TEMPLATE_TYPES].map((item) => {
    const status = resolveItemStatus(saved, draft, item, locale);
    const isSender = item === EMAIL_SENDER_ITEM;
    return {
      value: item,
      label: isSender
        ? t('senderItemLabel')
        : tTemplate(`templateTypeLabel.${item}`),
      group: isSender ? undefined : t('templateGroupLabel'),
      description: isSender
        ? t('senderItemDescription')
        : tTemplate(`templateTypeDescription.${item}`),
      status,
      statusLabel: tStatus(status),
    };
  });
};
