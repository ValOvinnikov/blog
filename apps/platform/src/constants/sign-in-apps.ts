import { ICONS } from '@blog/config';
import { OAUTH_PROVIDER, type TOAuthProvider } from '@blog/config/constants';
import type { TValueOf } from '@blog/config/utils';
import { TENANT_REFUSAL } from '@platform/constants/tenant';

export const SIGN_IN_APP_FIELD_ERROR = {
  REQUIRED: 'REQUIRED',
} as const;

export type TSignInAppFieldError = TValueOf<typeof SIGN_IN_APP_FIELD_ERROR>;

export const SIGN_IN_APP_REFUSAL = {
  ARCHIVED: TENANT_REFUSAL.ARCHIVED,
  NOT_ON_PLAN: 'NOT_ON_PLAN',
  NO_SAVED_APP: 'NO_SAVED_APP',
} as const;

export type TSignInAppRefusal = TValueOf<typeof SIGN_IN_APP_REFUSAL>;

export const SIGN_IN_APP_LOG = {
  SAVE_FAILED: 'sign_in_app.save_failed',
  SAVE_AUDIT_FAILED: 'sign_in_app.save_audit_failed',
  REMOVE_FAILED: 'sign_in_app.remove_failed',
  REMOVE_AUDIT_FAILED: 'sign_in_app.remove_audit_failed',
  CONFIRM_CALLBACK_FAILED: 'sign_in_app.confirm_callback_failed',
} as const;

export const OAUTH_CALLBACK_PATH = '/api/auth/callback';

export const MASKED_CLIENT_ID_LENGTH = 6;

export const CLIENT_ID_MASK = '••••••••';

export const OAUTH_PROVIDERS: readonly TOAuthProvider[] = [
  OAUTH_PROVIDER.GOOGLE,
  OAUTH_PROVIDER.GITHUB,
];

export const OAUTH_PROVIDER_CONSOLE_URL = {
  [OAUTH_PROVIDER.GOOGLE]: 'https://console.cloud.google.com/apis/credentials',
  [OAUTH_PROVIDER.GITHUB]: 'https://github.com/settings/developers',
} as const satisfies Record<TOAuthProvider, string>;

export const SIGN_IN_APPS_MODE = {
  EDIT: 'EDIT',
  READ_ONLY: 'READ_ONLY',
  OPERATOR: 'OPERATOR',
  FREE: 'FREE',
} as const;

export type TSignInAppsMode = TValueOf<typeof SIGN_IN_APPS_MODE>;

export const SIGN_IN_APPS_NOTICE = {
  ARCHIVED: 'ARCHIVED',
  NOT_OWNER: 'NOT_OWNER',
} as const;

export type TSignInAppsNotice = TValueOf<typeof SIGN_IN_APPS_NOTICE>;

export const OAUTH_PROVIDER_ICON = {
  [OAUTH_PROVIDER.GOOGLE]: ICONS.GOOGLE,
  [OAUTH_PROVIDER.GITHUB]: ICONS.GITHUB,
} as const satisfies Record<TOAuthProvider, string>;
