export type TValidateEnv = {
  // Optional: unset means operator notification is skipped, not that the
  // sweep fails — see `notifyOperatorsOfDocumentValidationFailure`.
  resendApiKey?: string;
};

export function loadValidateEnv(): TValidateEnv {
  return {
    resendApiKey: process.env['RESEND_API_KEY'] || undefined,
  };
}
