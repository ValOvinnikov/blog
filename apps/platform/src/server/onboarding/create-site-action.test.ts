import {
  ACTION_OUTCOME,
  ERROR_CODE,
  LOCALE_ISO_CODES,
  NEXT_NAVIGATION_ERROR,
  PRESET_ID,
  SITE_TYPE,
  TERMS_VERSION,
} from '@blog/config';
import { errorResult, okResult } from '@blog/utils';
import { ONBOARDING_LOG } from '@platform/constants/onboarding';
import {
  SIGN_UP_FIELD_ERROR,
  SIGN_UP_REFUSAL,
} from '@platform/constants/sign-up';
import { TENANT_FIELD_ERROR, TENANT_REFUSAL } from '@platform/constants/tenant';
import { auth } from '@platform/server/auth/auth';
import { admitCreateSite } from '@platform/server/create-site-gate/admit-create-site';
import { startProvisioning } from '@platform/server/provisioning/start-provisioning';
import { checkTenantSlug } from '@platform/server/tenants/check-tenant-slug';
import {
  MOCK_SIGN_IN_EMAIL,
  MOCK_SIGN_IN_USER_ID,
} from '@platform/testing/auth/fixtures';
import { MOCK_TENANT_ROOT_DOMAIN } from '@platform/testing/env/fixtures';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import {
  MOCK_TENANT_ID,
  MOCK_TENANT_NAME,
} from '@platform/testing/tenants/fixtures';
import { env } from '@platform/utils/env/env';
import { logger } from '@platform/utils/logger/logger';
import { adminRoutes } from '@platform/utils/routes/routes';
import { redirect } from 'next/navigation';
import type { Session } from 'next-auth';

import { createSiteAction } from './create-site-action';
import type { TCreateSiteInput } from './create-site-input';

const {
  ownsFreeTenantMock,
  createSelfServeTenantMock,
  recordTermsAcceptanceMock,
} = vi.hoisted(() => ({
  ownsFreeTenantMock: vi.fn(),
  createSelfServeTenantMock: vi.fn(),
  recordTermsAcceptanceMock: vi.fn(),
}));

vi.mock('@platform/server/auth/auth');
vi.mock('@platform/utils/env/env');

vi.mock('next/headers', () => ({
  headers: vi.fn(async () => new Headers()),
}));

vi.mock('./require-onboarding-user', async () => {
  const { MOCK_SIGN_IN_USER_ID } =
    await import('@platform/testing/auth/fixtures');
  return { requireOnboardingUser: vi.fn(async () => MOCK_SIGN_IN_USER_ID) };
});

vi.mock('@platform/server/tenants/check-tenant-slug', () => ({
  checkTenantSlug: vi.fn(),
}));

vi.mock('@platform/server/create-site-gate/admit-create-site', () => ({
  admitCreateSite: vi.fn(),
}));

vi.mock('@platform/server/provisioning/start-provisioning', () => ({
  startProvisioning: vi.fn(),
}));

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    tenants: {
      ownsFreeTenant: ownsFreeTenantMock,
      createSelfServeTenant: createSelfServeTenantMock,
    },
    users: { recordTermsAcceptance: recordTermsAcceptanceMock },
  },
}));

const authMock = vi.mocked<() => Promise<Partial<Session> | null>>(auth);
const checkTenantSlugMock = vi.mocked(checkTenantSlug);
const admitCreateSiteMock = vi.mocked(admitCreateSite);
const startProvisioningMock = vi.mocked(startProvisioning);
const loggerErrorMock = vi.mocked(logger.error);

const MOCK_SLUG = 'my-site';
const MOCK_ACCENT_HUE = 120;
const MOCK_INPUT: TCreateSiteInput = {
  siteType: SITE_TYPE.PORTFOLIO,
  name: MOCK_TENANT_NAME,
  slug: MOCK_SLUG,
  locale: LOCALE_ISO_CODES.NL,
  preset: PRESET_ID.EDITORIAL,
  accentHue: MOCK_ACCENT_HUE,
  hasAcceptedTerms: true,
};

const expectRedirectToDashboard = async (input = MOCK_INPUT) => {
  await expect(createSiteAction(input)).rejects.toThrow(
    NEXT_NAVIGATION_ERROR.NEXT_REDIRECT,
  );
  expect(redirect).toHaveBeenCalledWith(adminRoutes.dashboard());
};

describe(createSiteAction, () => {
  beforeEach(() => {
    Object.assign(env, { TENANT_ROOT_DOMAIN: MOCK_TENANT_ROOT_DOMAIN });
    authMock.mockResolvedValue({
      user: { id: MOCK_SIGN_IN_USER_ID, email: MOCK_SIGN_IN_EMAIL },
    });
    checkTenantSlugMock.mockResolvedValue(undefined);
    ownsFreeTenantMock.mockResolvedValue(okResult(false));
    admitCreateSiteMock.mockResolvedValue(true);
    recordTermsAcceptanceMock.mockResolvedValue(undefined);
    createSelfServeTenantMock.mockResolvedValue(
      okResult({ id: MOCK_TENANT_ID }),
    );
    startProvisioningMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.SUCCESS,
    });
  });

  it('creates the site the user described, starts provisioning and opens the dashboard', async () => {
    await expectRedirectToDashboard();

    expect(createSelfServeTenantMock).toHaveBeenCalledWith({
      name: MOCK_TENANT_NAME,
      domain: `${MOCK_SLUG}.${MOCK_TENANT_ROOT_DOMAIN}`,
      locale: LOCALE_ISO_CODES.NL,
      siteType: SITE_TYPE.PORTFOLIO,
      preset: PRESET_ID.EDITORIAL,
      accentHue: MOCK_ACCENT_HUE,
      owner: { userId: MOCK_SIGN_IN_USER_ID, email: MOCK_SIGN_IN_EMAIL },
    });
    expect(recordTermsAcceptanceMock).toHaveBeenCalledWith(
      MOCK_SIGN_IN_USER_ID,
      TERMS_VERSION,
    );
    expect(startProvisioningMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
  });

  it('still opens the dashboard when the provisioning run could not be started', async () => {
    startProvisioningMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.SERVER_ERROR,
    });

    await expectRedirectToDashboard();
  });

  it('asks for the terms and a name without checking the address', async () => {
    const result = await createSiteAction({
      ...MOCK_INPUT,
      name: ' ',
      hasAcceptedTerms: false,
    });

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {
        name: { reason: TENANT_FIELD_ERROR.NAME_REQUIRED },
        hasAcceptedTerms: { reason: SIGN_UP_FIELD_ERROR.TERMS_NOT_ACCEPTED },
      },
    });
    expect(checkTenantSlugMock).not.toHaveBeenCalled();
  });

  it('refuses a site type the free plan does not offer', async () => {
    const result = await createSiteAction({
      ...MOCK_INPUT,
      siteType: SITE_TYPE.BUSINESS as TCreateSiteInput['siteType'],
    });

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {},
    });
  });

  it('reports a taken address on its field without spending a create slot', async () => {
    checkTenantSlugMock.mockResolvedValue(TENANT_FIELD_ERROR.SLUG_TAKEN);

    const result = await createSiteAction(MOCK_INPUT);

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: { slug: { reason: TENANT_FIELD_ERROR.SLUG_TAKEN } },
    });
    expect(admitCreateSiteMock).not.toHaveBeenCalled();
  });

  it('refuses a user who already owns a free site without spending a create slot', async () => {
    ownsFreeTenantMock.mockResolvedValue(okResult(true));

    const result = await createSiteAction(MOCK_INPUT);

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: TENANT_REFUSAL.OWNER_HAS_FREE_TENANT,
    });
    expect(admitCreateSiteMock).not.toHaveBeenCalled();
    expect(createSelfServeTenantMock).not.toHaveBeenCalled();
  });

  it('gives the neutral refusal when the create-site gate turns the user away', async () => {
    admitCreateSiteMock.mockResolvedValue(false);

    const result = await createSiteAction(MOCK_INPUT);

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: SIGN_UP_REFUSAL.TRY_AGAIN_LATER,
    });
    expect(admitCreateSiteMock).toHaveBeenCalledWith({
      clientKey: expect.any(String),
      email: MOCK_SIGN_IN_EMAIL,
    });
    expect(recordTermsAcceptanceMock).not.toHaveBeenCalled();
    expect(createSelfServeTenantMock).not.toHaveBeenCalled();
  });

  it('reports a concurrent submit of the same address on its field', async () => {
    createSelfServeTenantMock.mockResolvedValue(
      errorResult(ERROR_CODE.DB_DUPLICATE_DOMAIN),
    );

    const result = await createSiteAction(MOCK_INPUT);

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: { slug: { reason: TENANT_FIELD_ERROR.SLUG_TAKEN } },
    });
    expect(startProvisioningMock).not.toHaveBeenCalled();
  });

  it('refuses a second free site the database turned away', async () => {
    createSelfServeTenantMock.mockResolvedValue(
      errorResult(ERROR_CODE.DB_ALREADY_OWNS_FREE_TENANT),
    );

    const result = await createSiteAction(MOCK_INPUT);

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: TENANT_REFUSAL.OWNER_HAS_FREE_TENANT,
    });
  });

  it('logs and reports a failed write', async () => {
    const error = new Error('connection lost');
    createSelfServeTenantMock.mockRejectedValue(error);

    const result = await createSiteAction(MOCK_INPUT);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(loggerErrorMock).toHaveBeenCalledWith(ONBOARDING_LOG.CREATE_FAILED, {
      domain: `${MOCK_SLUG}.${MOCK_TENANT_ROOT_DOMAIN}`,
      error,
    });
    expect(startProvisioningMock).not.toHaveBeenCalled();
  });

  it('logs and reports a missing root domain', async () => {
    Object.assign(env, { TENANT_ROOT_DOMAIN: undefined });

    const result = await createSiteAction(MOCK_INPUT);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(loggerErrorMock).toHaveBeenCalledWith(
      ONBOARDING_LOG.ROOT_DOMAIN_MISSING,
    );
  });
});
