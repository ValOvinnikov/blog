'use client';

import { SIZE, type TEmailTemplateType } from '@blog/config';
import type { TEmailTemplateBlock } from '@blog/db/schema/email-templates';
import { EmailLogoField } from '@platform/components/features/email/email-logo-field';
import { Button } from '@platform/components/shared/button';
import { Card } from '@platform/components/shared/card';
import { FormField } from '@platform/components/shared/form-field';
import { FormTextInput } from '@platform/components/shared/form-text-input';
import { PortableTextEditor } from '@platform/components/shared/portable-text-editor';
import { StatusBadge } from '@platform/components/shared/status-badge';
import type {
  TEmailCopyDraft,
  TStagedLogo,
} from '@platform/utils/email-draft/email-draft';
import { isBlankPortableTextValue } from '@platform/utils/portable-text-schema/portable-text-schema';
import { useTranslations } from 'next-intl';
import { useId, useState } from 'react';

import { emailTemplateEditorVariants } from './email-template-editor-variants';

export type TEmailTemplateEditorProps = {
  templateType: TEmailTemplateType;
  languageName: string;
  copy: TEmailCopyDraft;
  fallback: { subject: string; body: TEmailTemplateBlock[] };
  logo: TStagedLogo;
  onCopyChange: (copy: TEmailCopyDraft) => void;
  onLogoStage: (logo: TStagedLogo) => void;
  isDisabled: boolean;
  archivedNoticeId?: string;
};

const isSameBody = (a: TEmailTemplateBlock[], b: TEmailTemplateBlock[]) =>
  JSON.stringify(a) === JSON.stringify(b);

export const EmailTemplateEditor = ({
  templateType,
  languageName,
  copy,
  fallback,
  logo,
  onCopyChange,
  onLogoStage,
  isDisabled,
  archivedNoticeId,
}: TEmailTemplateEditorProps) => {
  const t = useTranslations('emailTemplateEditor');
  const tStatus = useTranslations('emailItemStatus');
  const subjectId = useId();
  const [bodyRevision, setBodyRevision] = useState(0);
  const { stack, fieldStatus } = emailTemplateEditorVariants();

  const isSubjectCustomised = copy.subject !== '';
  const isBodyCustomised = copy.body !== null;

  const handleBodyChange = (body: TEmailTemplateBlock[]) =>
    onCopyChange({
      ...copy,
      body:
        isBlankPortableTextValue(body) || isSameBody(body, fallback.body)
          ? null
          : body,
    });

  const resetBody = () => {
    onCopyChange({ ...copy, body: null });
    setBodyRevision((revision) => revision + 1);
  };

  const renderFieldStatus = (isCustomised: boolean, onReset: () => void) => (
    <div className={fieldStatus()}>
      <StatusBadge tone={isCustomised ? 'plan' : 'neutral'} hasDot={false}>
        {isCustomised ? tStatus('customised') : tStatus('default')}
      </StatusBadge>
      {isCustomised && (
        <Button
          type="button"
          size={SIZE.SM}
          variant="secondary"
          onClick={onReset}
          isDisabled={isDisabled}
        >
          {t('useDefault')}
        </Button>
      )}
    </div>
  );

  return (
    <Card>
      <Card.Header
        title={t(`templateTypeLabel.${templateType}`)}
        supportingText={t(`templateTypeDescription.${templateType}`)}
        headingLevel={2}
      />
      <Card.Body>
        <div className={stack()}>
          <FormTextInput
            label={t('subjectLabel', { language: languageName })}
            htmlFor={subjectId}
            hint={t('subjectHint')}
            placeholder={fallback.subject}
            value={copy.subject}
            onChange={(subject) => onCopyChange({ ...copy, subject })}
            isDisabled={isDisabled}
            aria-describedby={archivedNoticeId}
            footer={renderFieldStatus(isSubjectCustomised, () =>
              onCopyChange({ ...copy, subject: '' }),
            )}
          />
          <FormField
            label={t('bodyLabel', { language: languageName })}
            hint={t('bodyHint')}
            footer={renderFieldStatus(isBodyCustomised, resetBody)}
          >
            <PortableTextEditor
              key={bodyRevision}
              initialValue={copy.body ?? fallback.body}
              onChange={handleBodyChange}
              ariaLabel={t('bodyLabel', { language: languageName })}
              isDisabled={isDisabled}
            />
          </FormField>
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
