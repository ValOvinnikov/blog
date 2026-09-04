export { escapeHtml } from './html/escape-html';
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
  buildOwnerElevationAlertEmail,
  type TOwnerElevationAlertInput,
  buildDocumentValidationAlertEmail,
  type TDocumentValidationAlertInput,
} from './templates/operator';
export { sendEmail, type TSendEmailInput } from './transport/send-email';
