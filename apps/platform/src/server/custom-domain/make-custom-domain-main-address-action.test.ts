import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  ERROR_CODE,
  NEXT_NAVIGATION_ERROR,
} from '@blog/config';
import { queries } from '@blog/db';
import { MEMBERSHIP_ROLE, TENANT_PLAN } from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';
import {
  CUSTOM_DOMAIN_LOG,
  CUSTOM_DOMAIN_REFUSAL,
} from '@platform/constants/custom-domain';
import { DOMAIN_VERIFICATION_STATUS } from '@platform/constants/domain';
import { recordAuditEvent } from '@platform/server/audit/record-audit-event';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import { getProjectDomain } from '@platform/server/provisioning/vercel-domains-api';
import { revalidateSiteConfig } from '@platform/server/site-config/revalidate-site-config';
import {
  mockOwnerContext,
  mockTenantDomainRows,
} from '@platform/testing/custom-domain/fixtures';
import { mockedEnv } from '@platform/testing/env/mocked-env';
import { mockMembership } from '@platform/testing/memberships/fixtures';
import {
  MOCK_CUSTOM_DOMAIN,
  MOCK_TENANT_DOMAIN,
  MOCK_TENANT_ID,
  MOCK_TENANT_ROOT_DOMAIN,
  mockReadyTenant,
  mockTenant,
} from '@platform/testing/tenants/fixtures';
import { logger } from '@platform/utils/logger/logger';
import { notFound } from 'next/navigation';

import { makeCustomDomainMainAddressAction } from './make-custom-domain-main-address-action';

vi.mock('@platform/server/auth/require-tenant-membership');

vi.mock('@platform/server/audit/record-audit-event');

vi.mock('@platform/server/site-config/revalidate-site-config');

vi.mock('@platform/utils/env/env');

vi.mock('@platform/server/provisioning/vercel-domains-api', () => ({
  getProjectDomain: vi.fn(),
}));

vi.mock('@blog/db', async () => {
  const { mockCustomDomainDb } =
    await import('@platform/testing/custom-domain/fixtures');
  return mockCustomDomainDb();
});

const { tenantDomains, tenants } = queries;

const MOCK_INPUT = { domain: MOCK_CUSTOM_DOMAIN };

const makeMain = (input = MOCK_INPUT) =>
  makeCustomDomainMainAddressAction(MOCK_TENANT_ID, input);

const asTenant = (overrides: Partial<TTenant>) =>
  vi
    .mocked(requireTenantMembership)
    .mockResolvedValueOnce(mockOwnerContext(overrides));

describe(makeCustomDomainMainAddressAction, () => {
  beforeEach(() => {
    mockedEnv.TENANT_ROOT_DOMAIN = MOCK_TENANT_ROOT_DOMAIN;
    vi.mocked(requireTenantMembership)
      .mockReset()
      .mockResolvedValue(mockOwnerContext({ plan: TENANT_PLAN.GROWTH }));
    vi.mocked(tenantDomains.listTenantDomains)
      .mockReset()
      .mockResolvedValue(mockTenantDomainRows());
    vi.mocked(getProjectDomain).mockReset().mockResolvedValue({
      status: DOMAIN_VERIFICATION_STATUS.VERIFIED,
      dnsRecords: [],
    });
    vi.mocked(tenants.setTenantPrimaryDomain)
      .mockReset()
      .mockResolvedValue({ ok: true, data: mockTenant() });
  });

  it.each([
    [
      'a caller without access to the tenant',
      () =>
        vi.mocked(requireTenantMembership).mockImplementationOnce(() => {
          notFound();
        }),
    ],
    [
      'a member who is not the owner',
      () =>
        vi.mocked(requireTenantMembership).mockResolvedValueOnce({
          tenant: mockReadyTenant({
            id: MOCK_TENANT_ID,
            plan: TENANT_PLAN.GROWTH,
          }),
          membership: mockMembership({ role: MEMBERSHIP_ROLE.READER }),
        }),
    ],
  ])('rejects %s', async (_name, arrange) => {
    arrange();

    await expect(makeMain()).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
    );
    expect(tenants.setTenantPrimaryDomain).not.toHaveBeenCalled();
    expect(recordAuditEvent).not.toHaveBeenCalled();
  });

  it('points the main address at the verified domain, refreshes the site and audits it', async () => {
    const result = await makeMain();

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(tenants.setTenantPrimaryDomain).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      MOCK_CUSTOM_DOMAIN,
    );
    expect(revalidateSiteConfig).toHaveBeenCalledWith(MOCK_TENANT_ID);
    expect(recordAuditEvent).toHaveBeenCalledWith({
      logEvent: CUSTOM_DOMAIN_LOG.MAIN_ADDRESS_AUDIT_FAILED,
      action: AUDIT_ACTION.SETTINGS_UPDATED,
      targetType: AUDIT_TARGET_TYPE.TENANT,
      targetId: MOCK_TENANT_ID,
      details: {
        mainAddressChanged: {
          from: MOCK_TENANT_DOMAIN,
          to: MOCK_CUSTOM_DOMAIN,
        },
      },
    });
  });

  it('reports input that is not a domain without switching anything', async () => {
    const result = await makeMain({ domain: 'not a domain' });

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {},
    });
    expect(tenants.setTenantPrimaryDomain).not.toHaveBeenCalled();
  });

  it.each([
    [
      'an archived site',
      { deprovisionedAt: new Date() },
      CUSTOM_DOMAIN_REFUSAL.ARCHIVED,
    ],
    [
      'a Free site',
      { plan: TENANT_PLAN.FREE },
      CUSTOM_DOMAIN_REFUSAL.NOT_ON_PLAN,
    ],
  ])('refuses %s', async (_name, overrides, reason) => {
    asTenant(overrides);

    const result = await makeMain();

    expect(result).toEqual({ outcome: ACTION_OUTCOME.REFUSED, reason });
    expect(tenants.setTenantPrimaryDomain).not.toHaveBeenCalled();
    expect(recordAuditEvent).not.toHaveBeenCalled();
  });

  it.each([
    DOMAIN_VERIFICATION_STATUS.PENDING,
    DOMAIN_VERIFICATION_STATUS.NOT_ADDED,
    DOMAIN_VERIFICATION_STATUS.ERROR,
  ])('refuses a domain whose live status is %s', async (status) => {
    vi.mocked(getProjectDomain).mockResolvedValue({ status, dnsRecords: [] });

    const result = await makeMain();

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: CUSTOM_DOMAIN_REFUSAL.NOT_VERIFIED,
    });
    expect(tenants.setTenantPrimaryDomain).not.toHaveBeenCalled();
    expect(recordAuditEvent).not.toHaveBeenCalled();
  });

  it.each([
    ['a domain that is not the site custom domain', {}, MOCK_TENANT_DOMAIN],
    [
      'a custom domain that is already the main address',
      { primaryDomain: MOCK_CUSTOM_DOMAIN },
      MOCK_CUSTOM_DOMAIN,
    ],
  ])('refuses to switch to %s', async (_name, overrides, domain) => {
    asTenant({ plan: TENANT_PLAN.GROWTH, ...overrides });

    const result = await makeMain({ domain });

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: CUSTOM_DOMAIN_REFUSAL.NOT_CUSTOM_DOMAIN,
    });
    expect(getProjectDomain).not.toHaveBeenCalled();
    expect(tenants.setTenantPrimaryDomain).not.toHaveBeenCalled();
  });

  it('refuses and records nothing when the domain row is gone', async () => {
    vi.mocked(tenants.setTenantPrimaryDomain).mockResolvedValue({
      ok: false,
      error: ERROR_CODE.DB_NOT_FOUND,
    });

    const result = await makeMain();

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: CUSTOM_DOMAIN_REFUSAL.ADDRESS_NOT_FOUND,
    });
    expect(revalidateSiteConfig).not.toHaveBeenCalled();
    expect(recordAuditEvent).not.toHaveBeenCalled();
  });

  it('logs a server error and records nothing when the write fails', async () => {
    vi.mocked(tenants.setTenantPrimaryDomain).mockResolvedValue({
      ok: false,
      error: ERROR_CODE.DB_INVALID_DOMAIN,
    });

    const result = await makeMain();

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(logger.error).toHaveBeenCalledWith(
      CUSTOM_DOMAIN_LOG.MAIN_ADDRESS_FAILED,
      {
        tenantId: MOCK_TENANT_ID,
        domain: MOCK_CUSTOM_DOMAIN,
        error: ERROR_CODE.DB_INVALID_DOMAIN,
      },
    );
    expect(revalidateSiteConfig).not.toHaveBeenCalled();
    expect(recordAuditEvent).not.toHaveBeenCalled();
  });

  it('reports a server error when the write throws', async () => {
    vi.mocked(tenants.setTenantPrimaryDomain).mockRejectedValue(
      new Error('db down'),
    );

    const result = await makeMain();

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(recordAuditEvent).not.toHaveBeenCalled();
  });
});
