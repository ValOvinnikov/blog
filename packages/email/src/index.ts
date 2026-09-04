export { emailBrandTokens } from './html/brand-tokens';
export { escapeHtml } from './html/escape-html';
export { buildEmailShell, type TEmailShellInput } from './html/email-shell';
export {
  buildOwnerElevationAlertEmail,
  type TOwnerElevationAlertInput,
  buildDocumentValidationAlertEmail,
  type TDocumentValidationAlertInput,
} from './templates/operator';
export { sendEmail, type TSendEmailInput } from './transport/send-email';
