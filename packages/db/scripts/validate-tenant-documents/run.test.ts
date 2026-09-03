import { FINDING_SEVERITY } from '@blog/config/constants';
import { TENANT_STATUS } from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';

import {
  hasSystemicFailures,
  runValidation,
  runValidationForTenant,
} from './run';

const { listTenantsForDocumentValidationMock } = vi.hoisted(() => ({
  listTenantsForDocumentValidationMock: vi.fn(),
}));
const { getTenantByIdMock } = vi.hoisted(() => ({
  getTenantByIdMock: vi.fn(),
}));
const { getTenantSanityCredentialsMock } = vi.hoisted(() => ({
  getTenantSanityCredentialsMock: vi.fn(),
}));
const { validateTenantDocumentsMock } = vi.hoisted(() => ({
  validateTenantDocumentsMock: vi.fn(),
}));
const { listFindingsForTenantMock } = vi.hoisted(() => ({
  listFindingsForTenantMock: vi.fn(),
}));
const { openFindingMock } = vi.hoisted(() => ({ openFindingMock: vi.fn() }));
const { resolveFindingMock } = vi.hoisted(() => ({
  resolveFindingMock: vi.fn(),
}));
const { notifyMock } = vi.hoisted(() => ({ notifyMock: vi.fn() }));

vi.mock('@blog/db/queries/tenants', () => ({
  listTenantsForDocumentValidation: listTenantsForDocumentValidationMock,
  getTenantById: getTenantByIdMock,
  getTenantSanityCredentials: getTenantSanityCredentialsMock,
}));
vi.mock('@blog/db/queries/findings', () => ({
  listFindingsForTenant: listFindingsForTenantMock,
  openFinding: openFindingMock,
  resolveFinding: resolveFindingMock,
}));
vi.mock('./lib/run-sanity-documents-validate', () => ({
  validateTenantDocuments: validateTenantDocumentsMock,
}));
vi.mock('./lib/notify-operators', () => ({
  notifyOperatorsOfDocumentValidationFailure: notifyMock,
}));

const env = { resendApiKey: 'resend-key' };

function tenant(id: string, name: string): TTenant {
  return {
    id,
    name,
    primaryDomain: `${name}.example.com`,
    sanityProjectId: `proj-${name}`,
    sanityDataset: 'production',
    sanityReadTokenEncrypted: 'encrypted',
    sanityWriteTokenEncrypted: 'encrypted',
    locale: 'en',
    plan: 'FREE',
    status: TENANT_STATUS.ACTIVE,
    provisioningStatus: 'READY',
    provisioningSteps: null,
    lastNotifiedOwnerElevationOutcome: null,
    studioVercelProjectId: null,
    seededAt: null,
    webhookCreatedAt: null,
    deprovisionedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };
}

function credentials(tenantId: string) {
  return {
    projectId: `proj-${tenantId}`,
    dataset: 'production',
    token: `token-${tenantId}`,
    status: TENANT_STATUS.ACTIVE,
    deprovisionedAt: null,
    provisioningStatus: 'READY',
  };
}

beforeEach(() => {
  listTenantsForDocumentValidationMock.mockReset().mockResolvedValue([]);
  getTenantByIdMock.mockReset();
  getTenantSanityCredentialsMock
    .mockReset()
    .mockImplementation((tenantId: string) =>
      Promise.resolve(credentials(tenantId)),
    );
  validateTenantDocumentsMock.mockReset().mockReturnValue([]);
  listFindingsForTenantMock.mockReset().mockResolvedValue([]);
  openFindingMock.mockReset().mockImplementation(() =>
    Promise.resolve({
      ok: true,
      data: { finding: { id: 'finding-1' }, isNewlyOpened: true },
    }),
  );
  resolveFindingMock
    .mockReset()
    .mockResolvedValue({ ok: true, data: { id: 'finding-1' } });
  notifyMock.mockReset().mockResolvedValue(undefined);
});

describe(runValidation, () => {
  it('is a clean no-op when there are no in-scope tenants', async () => {
    const summary = await runValidation(env);

    expect(summary).toEqual({
      checked: 0,
      clean: 0,
      warning: 0,
      critical: 0,
      skipped: 0,
      errors: 0,
    });
  });

  it('tallies clean, warning and critical outcomes across tenants', async () => {
    const tenants = [
      tenant('t1', 'acme'),
      tenant('t2', 'globex'),
      tenant('t3', 'initech'),
    ];
    listTenantsForDocumentValidationMock.mockResolvedValue(tenants);
    validateTenantDocumentsMock
      .mockReturnValueOnce([])
      .mockReturnValueOnce([
        {
          documentId: 'doc-1',
          documentType: 'blog_post',
          level: 'warning',
          markers: [],
        },
      ])
      .mockReturnValueOnce([
        {
          documentId: 'doc-2',
          documentType: 'blog_post',
          level: 'error',
          markers: [],
        },
      ]);

    const summary = await runValidation(env);

    expect(summary).toEqual({
      checked: 3,
      clean: 1,
      warning: 1,
      critical: 1,
      skipped: 0,
      errors: 0,
    });
  });

  it('tallies a tenant with no Sanity credentials yet as skipped', async () => {
    listTenantsForDocumentValidationMock.mockResolvedValue([
      tenant('t1', 'acme'),
    ]);
    getTenantSanityCredentialsMock.mockResolvedValue(undefined);

    const summary = await runValidation(env);

    expect(summary).toEqual({
      checked: 1,
      clean: 0,
      warning: 0,
      critical: 0,
      skipped: 1,
      errors: 0,
    });
    expect(validateTenantDocumentsMock).not.toHaveBeenCalled();
  });

  it('skips a tenant whose credentials resolve to a non-ACTIVE status', async () => {
    listTenantsForDocumentValidationMock.mockResolvedValue([
      tenant('t1', 'acme'),
    ]);
    getTenantSanityCredentialsMock.mockResolvedValue({
      ...credentials('t1'),
      status: TENANT_STATUS.SUSPENDED,
    });

    const summary = await runValidation(env);

    expect(summary).toEqual({
      checked: 1,
      clean: 0,
      warning: 0,
      critical: 0,
      skipped: 1,
      errors: 0,
    });
    expect(validateTenantDocumentsMock).not.toHaveBeenCalled();
  });

  it('skips a tenant whose credentials resolve to a deprovisioned timestamp', async () => {
    listTenantsForDocumentValidationMock.mockResolvedValue([
      tenant('t1', 'acme'),
    ]);
    getTenantSanityCredentialsMock.mockResolvedValue({
      ...credentials('t1'),
      deprovisionedAt: new Date('2026-01-02T00:00:00.000Z'),
    });

    const summary = await runValidation(env);

    expect(summary).toEqual({
      checked: 1,
      clean: 0,
      warning: 0,
      critical: 0,
      skipped: 1,
      errors: 0,
    });
    expect(validateTenantDocumentsMock).not.toHaveBeenCalled();
  });

  it("one tenant's failure does not abort the sweep for the rest", async () => {
    const tenants = [
      tenant('t1', 'acme'),
      tenant('t2', 'globex'),
      tenant('t3', 'initech'),
    ];
    listTenantsForDocumentValidationMock.mockResolvedValue(tenants);
    validateTenantDocumentsMock
      .mockReturnValueOnce([])
      .mockImplementationOnce(() => {
        throw new Error('sanity CLI crashed');
      })
      .mockReturnValueOnce([]);

    const summary = await runValidation(env);

    expect(summary).toEqual({
      checked: 3,
      clean: 2,
      warning: 0,
      critical: 0,
      skipped: 0,
      errors: 1,
    });
    expect(validateTenantDocumentsMock).toHaveBeenCalledTimes(3);
    expect(hasSystemicFailures(summary)).toBe(true);
  });

  it('opens a finding for a tenant with invalid documents', async () => {
    listTenantsForDocumentValidationMock.mockResolvedValue([
      tenant('t1', 'acme'),
    ]);
    validateTenantDocumentsMock.mockReturnValue([
      {
        documentId: 'doc-1',
        documentType: 'blog_post',
        level: 'error',
        markers: [],
      },
    ]);

    await runValidation(env);

    expect(openFindingMock).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 't1',
        severity: FINDING_SEVERITY.CRITICAL,
      }),
    );
  });

  it('notifies operators only when the finding is newly opened, not on a repeat open', async () => {
    listTenantsForDocumentValidationMock.mockResolvedValue([
      tenant('t1', 'acme'),
      tenant('t2', 'globex'),
    ]);
    validateTenantDocumentsMock.mockReturnValue([
      {
        documentId: 'doc-1',
        documentType: 'blog_post',
        level: 'warning',
        markers: [],
      },
    ]);
    openFindingMock
      .mockResolvedValueOnce({
        ok: true,
        data: { finding: { id: 'f1' }, isNewlyOpened: true },
      })
      .mockResolvedValueOnce({
        ok: true,
        data: { finding: { id: 'f2' }, isNewlyOpened: false },
      });

    await runValidation(env);

    expect(notifyMock).toHaveBeenCalledTimes(1);
  });

  it('resolves a previously open finding once the tenant validates clean again', async () => {
    listTenantsForDocumentValidationMock.mockResolvedValue([
      tenant('t1', 'acme'),
    ]);
    validateTenantDocumentsMock.mockReturnValue([]);
    listFindingsForTenantMock.mockResolvedValue([
      {
        id: 'finding-1',
        tenantId: 't1',
        source: 'DOCUMENT_VALIDATION',
        kind: 'SCHEMA_VALIDATION_ERROR',
        status: 'OPEN',
      },
    ]);

    await runValidation(env);

    expect(resolveFindingMock).toHaveBeenCalledWith('finding-1');
  });

  it('does not resolve an open finding from a different source/kind', async () => {
    listTenantsForDocumentValidationMock.mockResolvedValue([
      tenant('t1', 'acme'),
    ]);
    validateTenantDocumentsMock.mockReturnValue([]);
    listFindingsForTenantMock.mockResolvedValue([
      {
        id: 'finding-1',
        tenantId: 't1',
        source: 'RECHECK_TENANT_OWNERS',
        kind: 'OWNER_CHECK_STALLED',
        status: 'OPEN',
      },
    ]);

    await runValidation(env);

    expect(resolveFindingMock).not.toHaveBeenCalled();
  });
});

describe(runValidationForTenant, () => {
  it('validates only the given tenant', async () => {
    getTenantByIdMock.mockResolvedValue(tenant('t1', 'acme'));
    validateTenantDocumentsMock.mockReturnValue([]);

    const summary = await runValidationForTenant('t1', env);

    expect(summary.checked).toBe(1);
    expect(getTenantByIdMock).toHaveBeenCalledWith('t1');
    expect(listTenantsForDocumentValidationMock).not.toHaveBeenCalled();
  });

  it('returns an empty summary when the tenant id does not resolve', async () => {
    getTenantByIdMock.mockResolvedValue(undefined);

    const summary = await runValidationForTenant('missing', env);

    expect(summary.checked).toBe(0);
    expect(validateTenantDocumentsMock).not.toHaveBeenCalled();
  });
});

describe(hasSystemicFailures, () => {
  it('is false when every candidate resolved to an expected outcome', () => {
    expect(
      hasSystemicFailures({
        checked: 3,
        clean: 1,
        warning: 1,
        critical: 1,
        skipped: 0,
        errors: 0,
      }),
    ).toBe(false);
  });

  it('is true when at least one candidate threw', () => {
    expect(
      hasSystemicFailures({
        checked: 3,
        clean: 2,
        warning: 0,
        critical: 0,
        skipped: 0,
        errors: 1,
      }),
    ).toBe(true);
  });
});
