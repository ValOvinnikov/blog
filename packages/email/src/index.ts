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
  buildInactivityWarningAlertEmail,
  type TInactivityWarningAlertInput,
} from './templates/operator';
export {
  buildOwnerInviteHeadsUpEmail,
  type TOwnerInviteHeadsUpEmailInput,
  buildOwnerInviteNudgeEmail,
  type TOwnerInviteNudgeEmailInput,
  buildOwnerSiteReadyEmail,
  type TOwnerSiteReadyEmailInput,
  buildOwnerInactivityWarningEmail,
  type TOwnerInactivityWarningEmailInput,
  buildOwnerDeletionNoticeEmail,
  type TOwnerDeletionNoticeEmailInput,
} from './templates/owner';
export {
  buildMagicLinkEmail,
  type TMagicLinkEmailInput,
  type TMagicLinkEmailContent,
  buildInviteMagicLinkEmail,
  type TMagicLinkInviteEmailInput,
  buildNewsletterConfirmationEmail,
  type TNewsletterConfirmationEmailInput,
  type TNewsletterConfirmationEmailContent,
  buildContactNotificationEmail,
  type TContactNotificationEmailInput,
  type TContactNotificationEmailContent,
  type TTenantEmailIdentity,
} from './templates/tenant';
export { sendEmail, type TSendEmailInput } from './transport/send-email';
export { isValidEmailAddress } from './validation';
