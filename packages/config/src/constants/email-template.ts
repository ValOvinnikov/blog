import type { TValueOf } from '@shinefold/config/utils';

export const EMAIL_TEMPLATE_TYPE = {
  MAGIC_LINK: 'MAGIC_LINK',
  TENANT_INVITE: 'TENANT_INVITE',
  NEWSLETTER_CONFIRMATION: 'NEWSLETTER_CONFIRMATION',
} as const;

export type TEmailTemplateType = TValueOf<typeof EMAIL_TEMPLATE_TYPE>;
