export { escapeHtml } from './html/escape-html';
export {
  renderEmailAction,
  type TEmailAction,
  type TEmailActionBrand,
} from './html/email-action';
export {
  buildOperatorShell,
  type TBuildOperatorShellInput,
} from './html/operator-shell';
export {
  buildTenantShell,
  type TBuildTenantShellInput,
  type TTenantEmailBrand,
} from './html/tenant-shell';
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
  buildTenantActionEmail,
  type TBuildTenantActionEmailInput,
} from './templates/tenant';
export { sendEmail, type TSendEmailInput } from './transport/send-email';
