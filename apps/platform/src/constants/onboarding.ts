import { SITE_TYPE } from '@blog/config';
import type { TValueOf } from '@blog/config/utils';

export const SELF_SERVE_SITE_TYPES = [
  SITE_TYPE.BLOG,
  SITE_TYPE.PORTFOLIO,
  SITE_TYPE.PERSONAL,
  SITE_TYPE.DOCS,
  SITE_TYPE.BLANK,
] as const;

export type TSelfServeSiteType = (typeof SELF_SERVE_SITE_TYPES)[number];

export const SITE_ADDRESS_STATUS = {
  IDLE: 'IDLE',
  CHECKING: 'CHECKING',
  AVAILABLE: 'AVAILABLE',
  UNAVAILABLE: 'UNAVAILABLE',
  UNVERIFIED: 'UNVERIFIED',
} as const;

export type TSiteAddressStatus = TValueOf<typeof SITE_ADDRESS_STATUS>;

export const ONBOARDING_STEP = {
  SITE: 'SITE',
  ADDRESS: 'ADDRESS',
  LOOK: 'LOOK',
  REVIEW: 'REVIEW',
} as const;

export type TOnboardingStep = TValueOf<typeof ONBOARDING_STEP>;

export const ONBOARDING_LOG = {
  ROOT_DOMAIN_MISSING: 'onboarding.root_domain_missing',
  SESSION_EMAIL_MISSING: 'onboarding.session_email_missing',
  OWNS_FREE_TENANT_CHECK_FAILED: 'onboarding.owns_free_tenant_check_failed',
  TERMS_RECORD_FAILED: 'onboarding.terms_record_failed',
  CREATE_FAILED: 'onboarding.create_failed',
} as const;
