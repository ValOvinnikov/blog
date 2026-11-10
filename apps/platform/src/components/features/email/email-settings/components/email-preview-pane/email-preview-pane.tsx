'use client';

import type { TEmailTemplateType, TLocaleIsoCode } from '@blog/config';
import type { TTenantEmailBrand } from '@blog/email/html';
import { EmailPreview } from '@platform/components/features/email/email-preview';
import { SendTestEmailButton } from '@platform/components/features/email/email-settings/components/send-test-email-button';
import type { TEmailDraft } from '@platform/utils/email-draft/email-draft';
import { useTranslations } from 'next-intl';

import { useEmailPreview } from './use-email-preview';

type TEmailPreviewPaneProps = {
  tenantId: string;
  draft: TEmailDraft;
  templateType: TEmailTemplateType;
  locale: TLocaleIsoCode;
  defaultLocale: TLocaleIsoCode;
  brand: TTenantEmailBrand;
  brandName: string;
};

export const EmailPreviewPane = ({
  tenantId,
  draft,
  templateType,
  locale,
  defaultLocale,
  brand,
  brandName,
}: TEmailPreviewPaneProps) => {
  const t = useTranslations('emailPreview');
  const { html, subject, body, hasUnsavedLogo } = useEmailPreview({
    draft,
    templateType,
    locale,
    defaultLocale,
    brand,
    brandName,
  });

  return (
    <EmailPreview
      html={html}
      sender={draft.sender}
      subject={subject}
      actions={
        <SendTestEmailButton
          tenantId={tenantId}
          email={{ templateType, subject, body, sender: draft.sender }}
        />
      }
      notes={hasUnsavedLogo && <p>{t('unsavedLogoNote')}</p>}
    />
  );
};
