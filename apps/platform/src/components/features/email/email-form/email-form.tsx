'use client';

import type { TTenantEmailBrand } from '@blog/email/html';
import {
  EmailSettingsForm,
  type TEmailSettingsFormValues,
} from '@platform/components/features/email/email-settings-form';
import {
  EmailTemplatesSection,
  type TEmailTemplatesSectionProps,
} from '@platform/components/features/email/email-templates-section';
import { ArchivedTenantNotice } from '@platform/components/shared/archived-tenant-notice';
import { PageHeader } from '@platform/components/shared/page-header';
import { useTranslations } from 'next-intl';
import { useId } from 'react';

import { emailFormVariants } from './email-form-variants';

export type TEmailFormProps = {
  tenantId: string;
  initialSettings: TEmailSettingsFormValues;
  templates: TEmailTemplatesSectionProps['templates'];
  brand: TTenantEmailBrand;
  brandName: string;
  /** When set, the tenant is archived: every save action is disabled and a notice explains why. */
  archivedAt?: Date;
};

/**
 * The Email tab's top-level layout — a settings card (sender identity,
 * reply-to, footer address, tenant logo) above a per-template copy editor.
 * Each card manages its own save independently, the same split as the
 * subject/body being separate from the site's own Look/Voice tabs.
 */
export const EmailForm = ({
  tenantId,
  initialSettings,
  templates,
  brand,
  brandName,
  archivedAt,
}: TEmailFormProps) => {
  const t = useTranslations('emailForm');
  const isArchived = Boolean(archivedAt);
  const archivedNoticeId = useId();

  const { root } = emailFormVariants();

  return (
    <div className={root()}>
      <PageHeader title={t('pageHeading')} description={t('pageSubtitle')} />

      {archivedAt && (
        <ArchivedTenantNotice id={archivedNoticeId} archivedAt={archivedAt} />
      )}

      <EmailSettingsForm
        tenantId={tenantId}
        initialValues={initialSettings}
        isArchived={isArchived}
        archivedNoticeId={archivedNoticeId}
      />

      <EmailTemplatesSection
        tenantId={tenantId}
        templates={templates}
        brand={brand}
        brandName={brandName}
        isArchived={isArchived}
        archivedNoticeId={archivedNoticeId}
      />
    </div>
  );
};
