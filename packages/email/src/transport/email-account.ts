export const EMAIL_ACCOUNT = {
  PLATFORM: 'PLATFORM',
  TENANT: 'TENANT',
} as const;

export type TEmailAccount = (typeof EMAIL_ACCOUNT)[keyof typeof EMAIL_ACCOUNT];
