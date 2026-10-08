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
  buildMagicLinkEmail,
  type TMagicLinkEmailInput,
  type TMagicLinkEmailContent,
  buildInviteMagicLinkEmail,
  type TMagicLinkInviteEmailInput,
  buildNewsletterConfirmationEmail,
  type TNewsletterConfirmationEmailInput,
  type TNewsletterConfirmationEmailContent,
  type TTenantEmailIdentity,
} from './templates/tenant';
export { sendEmail, type TSendEmailInput } from './transport/send-email';
export { isValidEmailAddress } from './validation';
