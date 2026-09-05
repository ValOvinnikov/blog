export {
  escapeHtml,
  renderEmailAction,
  type TEmailAction,
  type TEmailActionBrand,
  buildOperatorShell,
  type TBuildOperatorShellInput,
  sanitizeHref,
  buildTenantShell,
  type TBuildTenantShellInput,
  type TTenantEmailBrand,
} from './html';
export {
  serializePortableText,
  type TPortableTextBlock,
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
  buildTenantEmail,
  type TBuildTenantEmailInput,
  buildNewsletterConfirmationEmail,
  type TNewsletterConfirmationEmailInput,
  type TNewsletterConfirmationEmailContent,
} from './templates/tenant';
export { sendEmail, type TSendEmailInput } from './transport/send-email';
