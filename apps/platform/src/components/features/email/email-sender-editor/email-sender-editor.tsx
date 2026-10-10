'use client';

import { EmailLogoField } from '@platform/components/features/email/email-logo-field';
import { Card } from '@platform/components/shared/card';
import { FormTextInput } from '@platform/components/shared/form-text-input';
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
  const isDisabled = isArchived || isPending;
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
          <FormTextInput
            label={t('senderNameLabel')}
            hint={t('senderNameHint')}
            error={senderNameError}
            placeholder={tPreview('defaultSender')}
            value={sender.senderName}
            onChange={(value) => updateField('senderName', value)}
            isDisabled={isDisabled}
            aria-describedby={archivedDescribedBy}
          />
          <FormTextInput
            label={t('replyToLabel')}
            hint={t('replyToHint')}
            type="email"
            placeholder={tPreview('noReplyTo')}
            value={sender.replyToAddress}
            onChange={(value) => updateField('replyToAddress', value)}
            isDisabled={isDisabled}
            aria-describedby={archivedDescribedBy}
          />
          <FormTextInput
            label={t('footerAddressLabel')}
            hint={t('footerAddressHint')}
            value={sender.footerPostalAddress}
            onChange={(value) => updateField('footerPostalAddress', value)}
            isDisabled={isDisabled}
            aria-describedby={archivedDescribedBy}
          />
          <EmailLogoField
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
