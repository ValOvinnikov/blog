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
import { recordAuditEvent } from '@platform/server/audit/record-audit-event';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
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

import { makeSubdomainMainAddressAction } from './make-subdomain-main-address-action';

vi.mock('@platform/server/auth/require-tenant-membership');

vi.mock('@platform/server/audit/record-audit-event');

vi.mock('@platform/server/site-config/revalidate-site-config');

vi.mock('@platform/utils/env/env');

vi.mock('@blog/db', async () => {
  const { mockCustomDomainDb } =
    await import('@platform/testing/custom-domain/fixtures');
  return mockCustomDomainDb();
});

const { tenantDomains, tenants } = queries;

const switchBack = () => makeSubdomainMainAddressAction(MOCK_TENANT_ID);

const asTenant = (overrides: Partial<TTenant>) =>
  vi
    .mocked(requireTenantMembership)
    .mockResolvedValueOnce(mockOwnerContext(overrides));

describe(makeSubdomainMainAddressAction, () => {
  beforeEach(() => {
    mockedEnv.TENANT_ROOT_DOMAIN = MOCK_TENANT_ROOT_DOMAIN;
    vi.mocked(requireTenantMembership)
      .mockReset()
      .mockResolvedValue(
        mockOwnerContext({
          plan: TENANT_PLAN.GROWTH,
          primaryDomain: MOCK_CUSTOM_DOMAIN,
        }),
      );
    vi.mocked(tenantDomains.listTenantDomains)
      .mockReset()
      .mockResolvedValue(mockTenantDomainRows());
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
            primaryDomain: MOCK_CUSTOM_DOMAIN,
          }),
          membership: mockMembership({ role: MEMBERSHIP_ROLE.READER }),
        }),
    ],
  ])('rejects %s', async (_name, arrange) => {
    arrange();

    await expect(switchBack()).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
    );
    expect(tenants.setTenantPrimaryDomain).not.toHaveBeenCalled();
    expect(recordAuditEvent).not.toHaveBeenCalled();
  });

  it('points the main address back at the subdomain, refreshes the site and audits it', async () => {
    const result = await switchBack();

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(tenants.setTenantPrimaryDomain).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      MOCK_TENANT_DOMAIN,
    );
    expect(revalidateSiteConfig).toHaveBeenCalledWith(MOCK_TENANT_ID);
    expect(recordAuditEvent).toHaveBeenCalledWith({
      logEvent: CUSTOM_DOMAIN_LOG.MAIN_ADDRESS_AUDIT_FAILED,
      action: AUDIT_ACTION.SETTINGS_UPDATED,
      targetType: AUDIT_TARGET_TYPE.TENANT,
      targetId: MOCK_TENANT_ID,
      details: {
        mainAddressChanged: {
          from: MOCK_CUSTOM_DOMAIN,
          to: MOCK_TENANT_DOMAIN,
        },
      },
    });
  });

  it('lets a Free site switch back to its subdomain', async () => {
    asTenant({ plan: TENANT_PLAN.FREE, primaryDomain: MOCK_CUSTOM_DOMAIN });

    const result = await switchBack();

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
  });

  it('refuses an archived site', async () => {
    asTenant({
      primaryDomain: MOCK_CUSTOM_DOMAIN,
      deprovisionedAt: new Date(),
    });

    const result = await switchBack();

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: CUSTOM_DOMAIN_REFUSAL.ARCHIVED,
    });
    expect(tenants.setTenantPrimaryDomain).not.toHaveBeenCalled();
    expect(recordAuditEvent).not.toHaveBeenCalled();
  });

  it('refuses when the subdomain is already the main address', async () => {
    asTenant({ primaryDomain: MOCK_TENANT_DOMAIN });

    const result = await switchBack();

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: CUSTOM_DOMAIN_REFUSAL.ALREADY_MAIN_ADDRESS,
    });
    expect(tenants.setTenantPrimaryDomain).not.toHaveBeenCalled();
  });

  it('refuses when the site has no subdomain row', async () => {
    vi.mocked(tenantDomains.listTenantDomains).mockResolvedValue([
      { domain: MOCK_CUSTOM_DOMAIN },
    ] as never);

    const result = await switchBack();

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: CUSTOM_DOMAIN_REFUSAL.ADDRESS_NOT_FOUND,
    });
    expect(tenants.setTenantPrimaryDomain).not.toHaveBeenCalled();
  });

  it('refuses and records nothing when the subdomain row is gone', async () => {
    vi.mocked(tenants.setTenantPrimaryDomain).mockResolvedValue({
      ok: false,
      error: ERROR_CODE.DB_NOT_FOUND,
    });

    const result = await switchBack();

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

    const result = await switchBack();

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(logger.error).toHaveBeenCalledWith(
      CUSTOM_DOMAIN_LOG.MAIN_ADDRESS_FAILED,
      {
        tenantId: MOCK_TENANT_ID,
        domain: MOCK_TENANT_DOMAIN,
        error: ERROR_CODE.DB_INVALID_DOMAIN,
      },
    );
    expect(recordAuditEvent).not.toHaveBeenCalled();
  });
});
