'use client';

import {
  EMAIL_TEMPLATE_TYPE,
  type TEmailTemplateType,
  type TLocaleIsoCode,
} from '@blog/config';
import type { TTenantEmailBrand } from '@blog/email/html';
import type { TEmailDraft } from '@platform/utils/email-draft/email-draft';
import { resolveEmailPreview } from '@platform/utils/email-fallback-copy/email-fallback-copy';
import { buildEmailTemplatePreviewHtml } from '@platform/utils/email-template-preview-builder/email-template-preview-builder';
import { useState } from 'react';

type TUseEmailPreviewArgs = {
  draft: TEmailDraft;
  locale: TLocaleIsoCode;
  defaultLocale: TLocaleIsoCode;
  brand: TTenantEmailBrand;
  brandName: string;
};

export const useEmailPreview = ({
  draft,
  locale,
  defaultLocale,
  brand,
  brandName,
}: TUseEmailPreviewArgs) => {
  const [templateType, setTemplateType] = useState<TEmailTemplateType>(
    EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
  );
  const { subject, body, logo } = resolveEmailPreview(
    draft,
    templateType,
    locale,
    defaultLocale,
  );
  const html = buildEmailTemplatePreviewHtml(templateType, {
    subject,
    body,
    brand,
    brandName,
    logoImageUrl: logo.url,
    footerPostalAddress: draft.sender.footerPostalAddress.trim() || undefined,
  });

  return {
    templateType,
    setTemplateType,
    html,
    subject,
    body,
    hasUnsavedLogo: logo.file !== undefined,
  };
};
