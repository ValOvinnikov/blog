'use client';

import { EMAIL_TEMPLATE_TYPE, type TEmailTemplateType } from '@blog/config';
import type { TTenantEmailBrand } from '@blog/email/html';
import {
  EmailTemplateEditor,
  type TEmailTemplateEditorValues,
} from '@platform/components/features/email/email-template-editor';
import { SegmentedControl } from '@platform/components/shared/segmented-control';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { emailTemplatesSectionVariants } from './email-templates-section-variants';

const TEMPLATE_TYPES = Object.values(EMAIL_TEMPLATE_TYPE) as [
  TEmailTemplateType,
  ...TEmailTemplateType[],
];

export type TEmailTemplatesSectionProps = {
  tenantId: string;
  templates: Record<TEmailTemplateType, TEmailTemplateEditorValues>;
  brand: TTenantEmailBrand;
  brandName: string;
  isArchived?: boolean;
  archivedNoticeId?: string;
};

/**
 * Switches between the tenant's three template types — each one is a
 * separate editing session (`EmailTemplateEditor` remounts on switch via
 * its `key`), so an unsaved edit in one is simply left behind when the
 * operator moves to another rather than silently merged or blocked.
 */
export const EmailTemplatesSection = ({
  tenantId,
  templates,
  brand,
  brandName,
  isArchived = false,
  archivedNoticeId,
}: TEmailTemplatesSectionProps) => {
  const t = useTranslations('emailTemplatesSection');
  const tEditor = useTranslations('emailTemplateEditor');
  const [selectedType, setSelectedType] = useState<TEmailTemplateType>(
    TEMPLATE_TYPES[0],
  );

  const { root, heading, title, description } = emailTemplatesSectionVariants();

  return (
    <div className={root()}>
      <div className={heading()}>
        <h2 className={title()}>{t('heading')}</h2>
        <p className={description()}>{t('description')}</p>
      </div>
      <SegmentedControl
        options={TEMPLATE_TYPES.map((type) => ({
          value: type,
          label: tEditor(`templateTypeLabel.${type}`),
        }))}
        value={selectedType}
        onChange={setSelectedType}
        ariaLabel={t('segmentedControlAriaLabel')}
      />
      <EmailTemplateEditor
        key={selectedType}
        tenantId={tenantId}
        templateType={selectedType}
        initialValues={templates[selectedType]}
        brand={brand}
        brandName={brandName}
        isArchived={isArchived}
        archivedNoticeId={archivedNoticeId}
      />
    </div>
  );
};
