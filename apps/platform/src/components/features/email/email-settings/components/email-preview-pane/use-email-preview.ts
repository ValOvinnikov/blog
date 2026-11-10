'use client';

import type { TEmailTemplateType, TLocaleIsoCode } from '@blog/config';
import type { TTenantEmailBrand } from '@blog/email/html';
import { isUndefined } from '@blog/utils/primitives';
import type { TEmailDraft } from '@platform/utils/email-draft/email-draft';
import { resolveEmailPreview } from '@platform/utils/email-fallback-copy/email-fallback-copy';
import { buildEmailTemplatePreviewHtml } from '@platform/utils/email-template-preview-builder/email-template-preview-builder';

type TUseEmailPreviewArgs = {
  draft: TEmailDraft;
  templateType: TEmailTemplateType;
  locale: TLocaleIsoCode;
  defaultLocale: TLocaleIsoCode;
  brand: TTenantEmailBrand;
  brandName: string;
};

export const useEmailPreview = ({
  draft,
  templateType,
  locale,
  defaultLocale,
  brand,
  brandName,
}: TUseEmailPreviewArgs) => {
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
    html,
    subject,
    body,
    hasUnsavedLogo: !isUndefined(logo.file),
  };
};
