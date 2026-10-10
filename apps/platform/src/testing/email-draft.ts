import { EMAIL_TEMPLATE_TYPE, LOCALE_ISO_CODES } from '@blog/config';
import type { TEmailTemplateBlock } from '@blog/db/schema/email-templates';
import {
  buildEmailDraft,
  type TEmailDraft,
} from '@platform/utils/email-draft/email-draft';

const { EN, FR } = LOCALE_ISO_CODES;

export const EMAIL_DRAFT_LIVE_LOCALES = [EN, FR];

export const EMAIL_BODY: TEmailTemplateBlock[] = [
  {
    _type: 'block',
    _key: 'k1',
    style: 'normal',
    markDefs: [],
    children: [{ _type: 'span', _key: 's1', text: 'Hello', marks: [] }],
  },
];

export const buildTestEmailDraft = (): TEmailDraft =>
  buildEmailDraft({
    sender: { senderName: '', replyToAddress: '', footerPostalAddress: '' },
    senderLogoUrl: undefined,
    authored: [
      {
        templateType: EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
        locale: EN,
        subject: 'Sign in',
        body: null,
      },
    ],
    templateLogoUrls: {
      MAGIC_LINK: undefined,
      TENANT_INVITE: undefined,
      NEWSLETTER_CONFIRMATION: undefined,
    },
    liveLocales: EMAIL_DRAFT_LIVE_LOCALES,
  });
