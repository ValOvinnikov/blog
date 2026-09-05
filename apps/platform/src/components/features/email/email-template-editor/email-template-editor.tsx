'use client';

import { ALERT_TYPE, type TEmailTemplateType } from '@blog/config';
import type { TPortableTextBlock } from '@blog/db/schema/email-templates';
import { buildTenantEmail, type TTenantEmailBrand } from '@blog/email';
import { EmailLogoField } from '@platform/components/features/email/email-logo-field';
import { EmailTemplatePreview } from '@platform/components/features/email/email-template-preview';
import { Alert } from '@platform/components/shared/alert';
import { Button } from '@platform/components/shared/button';
import { Card } from '@platform/components/shared/card';
import { FormField } from '@platform/components/shared/form-field';
import { FormTextInput } from '@platform/components/shared/form-text-input';
import { Heading } from '@platform/components/shared/heading';
import { PortableTextEditor } from '@platform/components/shared/portable-text-editor';
import { useToast } from '@platform/context/toast-provider';
import { updateEmailTemplateAction } from '@platform/server/email-templates/update-email-template-action';
import { buildEmailTemplatePreviewAction } from '@platform/utils/email-template-preview-action-builder/email-template-preview-action-builder';
import { isBlankPortableTextValue } from '@platform/utils/portable-text-schema/portable-text-schema';
import { useFormSubmission } from '@platform/utils/use-form-submission/use-form-submission';
import { useTranslations } from 'next-intl';
import { useId, useMemo, useState } from 'react';

import { emailTemplateEditorVariants } from './email-template-editor-variants';

export type TEmailTemplateEditorValues = {
  subject: string;
  body: TPortableTextBlock[];
  logoAssetUrl: string | undefined;
};

export type TEmailTemplateEditorProps = {
  tenantId: string;
  templateType: TEmailTemplateType;
  initialValues: TEmailTemplateEditorValues;
  brand: TTenantEmailBrand;
  brandName: string;
  isArchived?: boolean;
  archivedNoticeId?: string;
};

/**
 * One template type's subject, body and logo, plus a live preview built
 * from the same `buildTenantEmail` the real send path calls. Remounted
 * (via a `key={templateType}` from its caller) rather than kept in sync
 * across template switches — each template type is its own editing session.
 */
export const EmailTemplateEditor = ({
  tenantId,
  templateType,
  initialValues,
  brand,
  brandName,
  isArchived = false,
  archivedNoticeId,
}: TEmailTemplateEditorProps) => {
  const t = useTranslations('emailTemplateEditor');
  const toast = useToast();
  const subjectId = useId();
  const archivedDescribedBy = isArchived ? archivedNoticeId : undefined;
  const [logoAssetUrl, setLogoAssetUrl] = useState(initialValues.logoAssetUrl);

  const { values, setValues, status, isPending, handleSubmit } =
    useFormSubmission<
      Pick<TEmailTemplateEditorValues, 'subject' | 'body'>,
      { ok: boolean }
    >({
      initialValues: {
        subject: initialValues.subject,
        body: initialValues.body,
      },
      onSubmit: (vals) =>
        updateEmailTemplateAction(tenantId, templateType, {
          subject: vals.subject.trim() === '' ? null : vals.subject.trim(),
          body: isBlankPortableTextValue(vals.body) ? null : vals.body,
        }),
      onSuccess: () => {
        toast.success({
          command: 'email-template',
          state: 'saved',
          message: t('alertSuccess'),
        });
      },
    });

  const previewHtml = useMemo(() => {
    return buildTenantEmail({
      brand,
      brandName,
      previewText: values.subject,
      body: values.body,
      action: buildEmailTemplatePreviewAction(templateType, t),
    });
  }, [brand, brandName, values.subject, values.body, templateType, t]);

  const { grid, stack, footer, previewHeading } = emailTemplateEditorVariants();

  return (
    <Card>
      <Card.Header
        title={t(`templateTypeLabel.${templateType}`)}
        supportingText={t(`templateTypeDescription.${templateType}`)}
        headingLevel={2}
      />
      <Card.Body>
        <div className={grid()}>
          <div className={stack()}>
            {status === 'error' && (
              <Alert type={ALERT_TYPE.ERROR} title={t('alertError')} />
            )}
            <FormTextInput
              label={t('subjectLabel')}
              htmlFor={subjectId}
              hint={t('subjectHint')}
              value={values.subject}
              onChange={(value) =>
                setValues((prev) => ({ ...prev, subject: value }))
              }
              isDisabled={isPending || isArchived}
              aria-describedby={archivedDescribedBy}
            />
            <FormField label={t('bodyLabel')} hint={t('bodyHint')}>
              <PortableTextEditor
                key={templateType}
                initialValue={initialValues.body}
                onChange={(body) => setValues((prev) => ({ ...prev, body }))}
                ariaLabel={t('bodyLabel')}
                isDisabled={isPending || isArchived}
              />
            </FormField>
            <EmailLogoField
              tenantId={tenantId}
              target={{ type: 'template', templateType }}
              label={t('logoLabel')}
              hint={t('logoHint')}
              currentUrl={logoAssetUrl}
              onChange={setLogoAssetUrl}
              isDisabled={isArchived}
              aria-describedby={archivedDescribedBy}
            />
          </div>
          <div className={stack()}>
            <Heading level={3} size="cardTitle" className={previewHeading()}>
              {t('previewHeading')}
            </Heading>
            <EmailTemplatePreview
              html={previewHtml}
              title={t('previewIframeTitle')}
            />
          </div>
        </div>
      </Card.Body>
      <Card.Footer>
        <div className={footer()}>
          <p>{t('actionLockedNote')}</p>
          <Button
            type="button"
            variant="primary"
            onClick={handleSubmit}
            isDisabled={isPending || isArchived}
            aria-describedby={archivedDescribedBy}
          >
            {isPending ? t('savingButton') : t('saveButton')}
          </Button>
        </div>
      </Card.Footer>
    </Card>
  );
};
