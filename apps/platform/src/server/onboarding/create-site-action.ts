'use server';

import { ACTION_OUTCOME, TERMS_VERSION } from '@blog/config';
import { queries } from '@blog/db';
import { toOutcome } from '@blog/utils/to-outcome';
import { ONBOARDING_LOG } from '@platform/constants/onboarding';
import {
  SIGN_UP_FIELD_ERROR,
  SIGN_UP_REFUSAL,
} from '@platform/constants/sign-up';
import { TENANT_FIELD_ERROR } from '@platform/constants/tenant';
import { getSession } from '@platform/server/auth/auth';
import { admitCreateSite } from '@platform/server/create-site-gate/admit-create-site';
import { startProvisioning } from '@platform/server/provisioning/start-provisioning';
import { resolveClientKey } from '@platform/server/rate-limit/resolve-client-key';
import { toTenantFieldErrors } from '@platform/server/tenants/tenant-field-error';
import { env } from '@platform/utils/env/env';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';
import { adminRoutes } from '@platform/utils/routes/routes';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { checkCreateSiteInput } from './check-create-site-input';
import {
  createSiteInputSchema,
  type TCreateSiteFieldError,
  type TCreateSiteInput,
  type TCreateSiteResult,
} from './create-site-input';
import { requireOnboardingUser } from './require-onboarding-user';
import { writeSelfServeSite } from './write-self-serve-site';

export const createSiteAction = async (
  input: TCreateSiteInput,
): Promise<TCreateSiteResult> => {
  const userId = await requireOnboardingUser();

  const parsed = createSiteInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: toTenantFieldErrors<
        keyof TCreateSiteInput,
        TCreateSiteFieldError
      >(parsed.error.issues, {
        name: TENANT_FIELD_ERROR.NAME_REQUIRED,
        slug: TENANT_FIELD_ERROR.SLUG_INVALID,
        hasAcceptedTerms: SIGN_UP_FIELD_ERROR.TERMS_NOT_ACCEPTED,
      }),
    };
  }

  const rootDomain = env.TENANT_ROOT_DOMAIN;
  const email = (await getSession())?.user?.email;
  if (!rootDomain || !email) {
    logger.error(
      rootDomain
        ? ONBOARDING_LOG.SESSION_EMAIL_MISSING
        : ONBOARDING_LOG.ROOT_DOMAIN_MISSING,
    );
    return toOutcome(ACTION_OUTCOME.SERVER_ERROR);
  }

  const { siteType, name, slug, locale, preset, accentHue } = parsed.data;
  const domain = `${slug}.${rootDomain}`;

  const inputFailure = await checkCreateSiteInput({ slug, rootDomain, email });
  if (inputFailure) return inputFailure;

  const clientKey = resolveClientKey(await headers());
  if (!(await admitCreateSite({ clientKey, email }))) {
    return {
      outcome: ACTION_OUTCOME.REFUSED,
      reason: SIGN_UP_REFUSAL.TRY_AGAIN_LATER,
    };
  }

  try {
    await queries.users.recordTermsAcceptance(userId, TERMS_VERSION);
  } catch (error) {
    logger.error(ONBOARDING_LOG.TERMS_RECORD_FAILED, toLoggableError(error));
    return toOutcome(ACTION_OUTCOME.SERVER_ERROR);
  }

  const created = await writeSelfServeSite({
    name,
    domain,
    locale,
    siteType,
    preset,
    accentHue,
    owner: { userId, email },
  });
  if (!created.ok) return created.error;

  await startProvisioning(created.data);

  redirect(adminRoutes.dashboard());
};
