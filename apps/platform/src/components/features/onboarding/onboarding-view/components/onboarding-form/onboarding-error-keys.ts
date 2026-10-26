import { ACTION_OUTCOME } from '@blog/config';
import {
  SIGN_UP_FIELD_ERROR,
  SIGN_UP_REFUSAL,
} from '@platform/constants/sign-up';
import { TENANT_FIELD_ERROR, TENANT_REFUSAL } from '@platform/constants/tenant';
import type { TCreateSiteFieldError } from '@platform/server/onboarding/create-site-input';

import type { TOnboardingFormFailure } from './use-onboarding-form';

export const ONBOARDING_FIELD_ERROR_KEYS = {
  [TENANT_FIELD_ERROR.NAME_REQUIRED]: 'nameRequired',
  [TENANT_FIELD_ERROR.SLUG_INVALID]: 'siteAddressInvalid',
  [TENANT_FIELD_ERROR.SLUG_RESERVED]: 'siteAddressReserved',
  [TENANT_FIELD_ERROR.SLUG_TAKEN]: 'siteAddressTaken',
  [SIGN_UP_FIELD_ERROR.TERMS_NOT_ACCEPTED]: 'termsNotAccepted',
} as const satisfies Record<TCreateSiteFieldError, string>;

export const ONBOARDING_FAILURE_KEYS = {
  [TENANT_REFUSAL.OWNER_HAS_FREE_TENANT]: 'alreadyOwnsFreeSite',
  [SIGN_UP_REFUSAL.TRY_AGAIN_LATER]: 'tryAgainLater',
  [ACTION_OUTCOME.SERVER_ERROR]: 'serverError',
} as const satisfies Record<TOnboardingFormFailure, string>;
