'use client';

import { CONTROL_MODE, type TEmailTemplateType } from '@blog/config';
import type { TEmailTemplateBlock } from '@blog/db/schema/email-templates';
import { EmailLogoField } from '@platform/components/features/email/email-logo-field';
import { Card } from '@platform/components/shared/card';
import { FieldStatus } from '@platform/components/shared/field-status';
import { FormField } from '@platform/components/shared/form-field';
import { PortableTextEditor } from '@platform/components/shared/portable-text-editor';
import { TextInput } from '@platform/components/shared/text-input';
import {
  isSameBody,
  type TEmailCopyDraft,
  type TEmailCopyEdit,
} from '@platform/utils/email-draft/email-draft';
import { isBlankPortableTextValue } from '@platform/utils/portable-text-schema/portable-text-schema';
import type { TStagedImage } from '@platform/utils/staged-image/staged-image';
import { useTranslations } from 'next-intl';
import { useId, useState } from 'react';

import { emailTemplateEditorVariants } from './email-template-editor-variants';

export type TEmailTemplateEditorProps = {
  templateType: TEmailTemplateType;
  languageName: string;
  copy: TEmailCopyEdit;
  logo: TStagedImage;
  onCopyChange: (copy: TEmailCopyDraft) => void;
  onLogoStage: (logo: TStagedImage) => void;
  isDisabled: boolean;
  archivedNoticeId?: string;
};

export const EmailTemplateEditor = ({
  templateType,
  languageName,
  copy,
  logo,
  onCopyChange,
  onLogoStage,
  isDisabled,
  archivedNoticeId,
}: TEmailTemplateEditorProps) => {
  const t = useTranslations('emailTemplateEditor');
  const [bodyRevision, setBodyRevision] = useState(0);
  const bodyHintId = useId();
  const { stack } = emailTemplateEditorVariants();
  const { draft, saved, fallback } = copy;

  const handleBodyChange = (body: TEmailTemplateBlock[]) =>
    onCopyChange({
      ...draft,
      body:
        isBlankPortableTextValue(body) || isSameBody(body, fallback.body)
          ? null
          : body,
    });

  const resetSubject = () => onCopyChange({ ...draft, subject: '' });

  const resetBody = () => {
    onCopyChange({ ...draft, body: null });
    setBodyRevision((revision) => revision + 1);
  };

  return (
    <Card>
      <Card.Header
        title={t(`templateTypeLabel.${templateType}`)}
        supportingText={t(`templateTypeDescription.${templateType}`)}
      />
      <Card.Body>
        <div className={stack()}>
          <FormField
            label={t('subjectLabel', { language: languageName })}
            hint={t('subjectHint')}
            actions={
              <FieldStatus
                isCustomised={draft.subject !== ''}
                isUnsaved={draft.subject !== saved.subject}
                onReset={isDisabled ? undefined : resetSubject}
              />
            }
          >
            <TextInput
              placeholder={fallback.subject}
              value={draft.subject}
              onChange={(subject) => onCopyChange({ ...draft, subject })}
              isDisabled={isDisabled}
              aria-describedby={archivedNoticeId}
            />
          </FormField>
          <FormField
            label={t('bodyLabel', { language: languageName })}
            hasOwnAccessibleName={true}
            hint={<span id={bodyHintId}>{t('bodyHint')}</span>}
            actions={
              <FieldStatus
                isCustomised={draft.body !== null}
                isUnsaved={!isSameBody(draft.body, saved.body)}
                onReset={isDisabled ? undefined : resetBody}
              />
            }
          >
            <PortableTextEditor
              key={bodyRevision}
              initialValue={draft.body ?? fallback.body}
              onChange={handleBodyChange}
              field={{ label: t('bodyLabel', { language: languageName }) }}
              mode={isDisabled ? CONTROL_MODE.DISABLED : CONTROL_MODE.EDITABLE}
              aria-describedby={[bodyHintId, archivedNoticeId]
                .filter(Boolean)
                .join(' ')}
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
