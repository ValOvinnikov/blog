import {
  CUSTOM_DOMAIN_FIELD_ERROR,
  CUSTOM_DOMAIN_REFUSAL,
  type TCustomDomainFieldError,
  type TCustomDomainRefusal,
} from '@platform/constants/custom-domain';

export const CUSTOM_DOMAIN_FIELD_ERROR_KEYS = {
  [CUSTOM_DOMAIN_FIELD_ERROR.DOMAIN_INVALID]: 'domainInvalid',
  [CUSTOM_DOMAIN_FIELD_ERROR.DOMAIN_PLATFORM_ADDRESS]: 'domainPlatformAddress',
  [CUSTOM_DOMAIN_FIELD_ERROR.DOMAIN_TAKEN]: 'domainTaken',
} satisfies Record<TCustomDomainFieldError, string>;

export const CUSTOM_DOMAIN_REFUSAL_KEYS = {
  [CUSTOM_DOMAIN_REFUSAL.NOT_FOUND]: 'notFound',
  [CUSTOM_DOMAIN_REFUSAL.ARCHIVED]: 'archived',
  [CUSTOM_DOMAIN_REFUSAL.NOT_ON_PLAN]: 'notOnPlan',
  [CUSTOM_DOMAIN_REFUSAL.NOT_PROVISIONED]: 'notProvisioned',
  [CUSTOM_DOMAIN_REFUSAL.ALREADY_CONNECTED]: 'alreadyConnected',
  [CUSTOM_DOMAIN_REFUSAL.NOT_CUSTOM_DOMAIN]: 'notCustomDomain',
} satisfies Record<TCustomDomainRefusal, string>;
