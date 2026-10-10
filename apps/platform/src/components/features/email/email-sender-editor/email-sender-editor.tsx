'use client';

import { EmailLogoField } from '@platform/components/features/email/email-logo-field';
import { Card } from '@platform/components/shared/card';
import { FormField } from '@platform/components/shared/form-field';
import { TextInput } from '@platform/components/shared/text-input';
import { EMAIL_LOGO_KIND } from '@platform/constants/email-logo';
import { useSettingsFormState } from '@platform/context/settings-form-provider';
import type { TEmailSenderDraft } from '@platform/utils/email-draft/email-draft';
import type { TStagedImage } from '@platform/utils/staged-image/staged-image';
import { useTranslations } from 'next-intl';

import { emailSenderEditorVariants } from './email-sender-editor-variants';

export type TEmailSenderEditorProps = {
  sender: TEmailSenderDraft;
  logo: TStagedImage;
  onSenderChange: (sender: TEmailSenderDraft) => void;
  onLogoStage: (logo: TStagedImage) => void;
  senderNameError?: string;
};

export const EmailSenderEditor = ({
  sender,
  logo,
  onSenderChange,
  onLogoStage,
  senderNameError,
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
            error={senderNameError}
            control={control}
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
