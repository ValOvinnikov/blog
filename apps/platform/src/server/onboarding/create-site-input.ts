import {
  type ACTION_OUTCOME,
  HUE_MAX,
  HUE_MIN,
  LOCALE_ISO_CODES,
  PRESET_ID,
  type TActionResult,
} from '@blog/config';
import { SELF_SERVE_SITE_TYPE } from '@platform/constants/onboarding';
import type {
  SIGN_UP_FIELD_ERROR,
  SIGN_UP_REFUSAL,
} from '@platform/constants/sign-up';
import type {
  TENANT_FIELD_ERROR,
  TENANT_REFUSAL,
} from '@platform/constants/tenant';
import { z } from 'zod';

export const createSiteInputSchema = z.object({
  siteType: z.enum(SELF_SERVE_SITE_TYPE),
  name: z.string().trim().min(1),
  slug: z.string().trim().toLowerCase().min(1),
  locale: z.enum(LOCALE_ISO_CODES),
  preset: z.enum(PRESET_ID),
  accentHue: z.number().int().min(HUE_MIN).max(HUE_MAX),
  hasAcceptedTerms: z.literal(true),
});

export type TCreateSiteInput = Omit<
  z.input<typeof createSiteInputSchema>,
  'hasAcceptedTerms'
> & { hasAcceptedTerms: boolean };

export type TCreateSiteFieldError =
  | typeof TENANT_FIELD_ERROR.NAME_REQUIRED
  | typeof TENANT_FIELD_ERROR.SLUG_INVALID
  | typeof TENANT_FIELD_ERROR.SLUG_RESERVED
  | typeof TENANT_FIELD_ERROR.SLUG_TAKEN
  | typeof SIGN_UP_FIELD_ERROR.TERMS_NOT_ACCEPTED;

export type TCreateSiteRefusal =
  | typeof TENANT_REFUSAL.OWNER_HAS_FREE_TENANT
  | typeof SIGN_UP_REFUSAL.TRY_AGAIN_LATER;

export type TCreateSiteResult = TActionResult<
  typeof ACTION_OUTCOME.REFUSED | typeof ACTION_OUTCOME.SERVER_ERROR,
  keyof TCreateSiteInput,
  TCreateSiteFieldError,
  TCreateSiteRefusal
>;
