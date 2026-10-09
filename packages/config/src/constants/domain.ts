import type { TValueOf } from '@blog/config/utils';

export const DOMAIN_VERIFICATION_STATUS = {
  NOT_CONFIGURED: 'NOT_CONFIGURED',
  NOT_ADDED: 'NOT_ADDED',
  PENDING: 'PENDING',
  VERIFIED: 'VERIFIED',
  ERROR: 'ERROR',
} as const;

export type TDomainVerificationStatus = TValueOf<
  typeof DOMAIN_VERIFICATION_STATUS
>;

export const DOMAIN_AVAILABILITY = {
  NOT_CONFIGURED: 'NOT_CONFIGURED',
  AVAILABLE: 'AVAILABLE',
  IN_USE: 'IN_USE',
  ERROR: 'ERROR',
} as const;

export type TDomainAvailability = TValueOf<typeof DOMAIN_AVAILABILITY>;
