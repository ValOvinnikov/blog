'use client';

import { EmailLogoField } from '@platform/components/features/email/email-logo-field';
import { Card } from '@platform/components/shared/card';
import { FormField } from '@platform/components/shared/form-field';
import { TextInput } from '@platform/components/shared/text-input';
import { EMAIL_LOGO_KIND } from '@platform/constants/email-logo';
import type { TEmailSenderFieldErrorReason } from '@platform/constants/email-sender';
import { useSettingsFormState } from '@platform/context/settings-form-provider';
import type { TSenderFieldErrors } from '@platform/server/email-config/update-email-config-action';
import type { TEmailSenderDraft } from '@platform/utils/email-draft/email-draft';
import type { TStagedImage } from '@platform/utils/staged-image/staged-image';
import { useTranslations } from 'next-intl';

import { emailSenderEditorVariants } from './email-sender-editor-variants';

const FIELD_ERROR_MESSAGE_KEY = {
  SENDER_NAME_INVALID: 'senderNameInvalid',
  CONTACT_RECIPIENT_INVALID: 'contactRecipientInvalid',
} as const satisfies Record<TEmailSenderFieldErrorReason, string>;

export type TEmailSenderEditorProps = {
  sender: TEmailSenderDraft;
  logo: TStagedImage;
  onSenderChange: (sender: TEmailSenderDraft) => void;
  onLogoStage: (logo: TStagedImage) => void;
  fieldIds: { senderName: string; contactRecipient: string };
  fieldErrors?: TSenderFieldErrors;
};

export const EmailSenderEditor = ({
  sender,
  logo,
  onSenderChange,
  onLogoStage,
  fieldIds,
  fieldErrors,
}: TEmailSenderEditorProps) => {
  const { isArchived, isPending, archivedDescribedBy } = useSettingsFormState();
  const control = {
    isDisabled: isArchived || isPending,
    describedBy: archivedDescribedBy,
  };
  const t = useTranslations('emailSettingsForm');
  const tItem = useTranslations('emailForm');
  const tPreview = useTranslations('emailPreview');
  const { stack } = emailSenderEditorVariants();

  const updateField = (field: keyof TEmailSenderDraft, value: string) =>
    onSenderChange({ ...sender, [field]: value });

  return (
    <Card>
      <Card.Header
        title={tItem('senderItemLabel')}
        supportingText={tItem('senderItemDescription')}
      />
      <Card.Body>
        <div className={stack()}>
          <FormField
            label={t('senderNameLabel')}
            hint={t('senderNameHint')}
            error={
              fieldErrors?.senderName &&
              t(
                `errors.${FIELD_ERROR_MESSAGE_KEY[fieldErrors.senderName.reason]}`,
              )
            }
            control={{ ...control, id: fieldIds.senderName }}
          >
            <TextInput
              placeholder={tPreview('defaultSender')}
              value={sender.senderName}
              onChange={(value) => updateField('senderName', value)}
            />
          </FormField>
          <FormField
            label={t('replyToLabel')}
            hint={t('replyToHint')}
            control={control}
          >
            <TextInput
              type="email"
              placeholder={tPreview('noReplyTo')}
              value={sender.replyToAddress}
              onChange={(value) => updateField('replyToAddress', value)}
            />
          </FormField>
          {sender.contactRecipient !== undefined && (
            <FormField
              label={t('contactRecipientLabel')}
              hint={t('contactRecipientHint')}
              error={
                fieldErrors?.contactRecipient &&
                t(
                  `errors.${FIELD_ERROR_MESSAGE_KEY[fieldErrors.contactRecipient.reason]}`,
                )
              }
              control={{ ...control, id: fieldIds.contactRecipient }}
            >
              <TextInput
                type="email"
                placeholder={t('contactRecipientPlaceholder')}
                value={sender.contactRecipient}
                onChange={(value) => updateField('contactRecipient', value)}
              />
            </FormField>
          )}
          <FormField
            label={t('footerAddressLabel')}
            hint={t('footerAddressHint')}
            control={control}
          >
            <TextInput
              value={sender.footerPostalAddress}
              onChange={(value) => updateField('footerPostalAddress', value)}
            />
          </FormField>
          <EmailLogoField
            kind={EMAIL_LOGO_KIND.SENDER}
            label={t('logoLabel')}
            hint={t('logoHint')}
            logo={logo}
            onStage={onLogoStage}
          />
        </div>
      </Card.Body>
    </Card>
  );
};
