export {
  escapeHtml,
  renderEmailAction,
  type TEmailAction,
  type TEmailActionBrand,
  buildOperatorShell,
  type TBuildOperatorShellInput,
  buildTenantShell,
  type TBuildTenantShellInput,
  type TTenantEmailBrand,
  PLATFORM_EMAIL_BRAND_NAME,
} from './html';
export {
  serializePortableText,
  type TEmailBlock,
  type TPortableTextContent,
  type TPortableTextMarkDef,
  type TPortableTextNode,
  type TPortableTextSpan,
} from './portable-text';
export {
  buildOwnerElevationAlertEmail,
  type TOwnerElevationAlertInput,
  buildDocumentValidationAlertEmail,
  type TDocumentValidationAlertInput,
} from './templates/operator';
export {
  buildOwnerInviteHeadsUpEmail,
  type TOwnerInviteHeadsUpEmailInput,
  buildOwnerInviteNudgeEmail,
  type TOwnerInviteNudgeEmailInput,
  buildOwnerSiteReadyEmail,
  type TOwnerSiteReadyEmailInput,
} from './templates/owner';
export {
  buildMagicLinkEmail,
  type TMagicLinkEmailInput,
  type TMagicLinkEmailContent,
  buildInviteMagicLinkEmail,
  type TMagicLinkInviteEmailInput,
  buildNewsletterConfirmationEmail,
  LIST_UNSUBSCRIBE_ONE_CLICK,
  type TNewsletterConfirmationEmailInput,
  type TNewsletterConfirmationEmailContent,
  buildContactNotificationEmail,
  type TContactNotificationEmailInput,
  type TContactNotificationEmailContent,
  type TTenantEmailIdentity,
} from './templates/tenant';
export { sendEmail, type TSendEmailInput } from './transport/send-email';
export { isValidEmailAddress } from './validation';
