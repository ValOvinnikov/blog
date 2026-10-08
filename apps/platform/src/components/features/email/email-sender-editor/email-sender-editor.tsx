'use client';

import { EmailLogoField } from '@platform/components/features/email/email-logo-field';
import { Card } from '@platform/components/shared/card';
import { FormTextInput } from '@platform/components/shared/form-text-input';
import type {
  TEmailSenderDraft,
  TStagedLogo,
} from '@platform/utils/email-draft/email-draft';
import { useTranslations } from 'next-intl';
import { useId } from 'react';

import { emailSenderEditorVariants } from './email-sender-editor-variants';

export type TEmailSenderEditorProps = {
  sender: TEmailSenderDraft;
  logo: TStagedLogo;
  onSenderChange: (sender: TEmailSenderDraft) => void;
  onLogoStage: (logo: TStagedLogo) => void;
  senderNameError?: string;
  isDisabled: boolean;
  archivedNoticeId?: string;
};

export const EmailSenderEditor = ({
  sender,
  logo,
  onSenderChange,
  onLogoStage,
  senderNameError,
  isDisabled,
  archivedNoticeId,
}: TEmailSenderEditorProps) => {
  const t = useTranslations('emailSettingsForm');
  const senderNameId = useId();
  const replyToId = useId();
  const footerAddressId = useId();
  const { stack } = emailSenderEditorVariants();

  const senderNameDescribedBy =
    [archivedNoticeId, senderNameError ? `${senderNameId}-error` : null]
      .filter(Boolean)
      .join(' ') || undefined;

  const updateField = (field: keyof TEmailSenderDraft, value: string) =>
    onSenderChange({ ...sender, [field]: value });

  return (
    <Card>
      <Card.Header
        title={t('heading')}
        supportingText={t('description')}
        headingLevel={2}
      />
      <Card.Body>
        <div className={stack()}>
          <FormTextInput
            label={t('senderNameLabel')}
            htmlFor={senderNameId}
            hint={t('senderNameHint')}
            error={senderNameError}
            isInvalid={senderNameError !== undefined}
            value={sender.senderName}
            onChange={(value) => updateField('senderName', value)}
            isDisabled={isDisabled}
            aria-describedby={senderNameDescribedBy}
          />
          <FormTextInput
            label={t('replyToLabel')}
            htmlFor={replyToId}
            hint={t('replyToHint')}
            type="email"
            value={sender.replyToAddress}
            onChange={(value) => updateField('replyToAddress', value)}
            isDisabled={isDisabled}
            aria-describedby={archivedNoticeId}
          />
          <FormTextInput
            label={t('footerAddressLabel')}
            htmlFor={footerAddressId}
            hint={t('footerAddressHint')}
            value={sender.footerPostalAddress}
            onChange={(value) => updateField('footerPostalAddress', value)}
            isDisabled={isDisabled}
            aria-describedby={archivedNoticeId}
          />
          <EmailLogoField
            label={t('logoLabel')}
            hint={t('logoHint')}
            logo={logo}
            onStage={onLogoStage}
            isDisabled={isDisabled}
            aria-describedby={archivedNoticeId}
          />
        </div>
      </Card.Body>
    </Card>
  );
};
