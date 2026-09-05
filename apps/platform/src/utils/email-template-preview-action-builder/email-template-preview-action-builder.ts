import { EMAIL_TEMPLATE_TYPE, type TEmailTemplateType } from '@blog/config';
import type { TEmailAction } from '@blog/email/html';

const PREVIEW_ACTION_LABEL_KEY: Record<TEmailTemplateType, string> = {
  [EMAIL_TEMPLATE_TYPE.MAGIC_LINK]: 'previewActionLabel.MAGIC_LINK',
  [EMAIL_TEMPLATE_TYPE.TENANT_INVITE]: 'previewActionLabel.TENANT_INVITE',
  [EMAIL_TEMPLATE_TYPE.NEWSLETTER_CONFIRMATION]:
    'previewActionLabel.NEWSLETTER_CONFIRMATION',
};

/**
 * The preview's stand-in for the template's locked action element — never
 * authored, never persisted, just what the real button/link would say by
 * default so the preview matches the shell the tenant's copy actually
 * renders inside.
 */
export const buildEmailTemplatePreviewAction = (
  templateType: TEmailTemplateType,
  t: (key: string) => string,
): TEmailAction => {
  return {
    label: t(PREVIEW_ACTION_LABEL_KEY[templateType]),
    url: 'https://example.com',
    variant: 'button',
  };
};
