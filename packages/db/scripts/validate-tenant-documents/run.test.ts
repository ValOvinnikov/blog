import {
  FINDING_KIND,
  FINDING_SEVERITY,
  FINDING_SOURCE,
  FINDING_STATUS,
} from '@blog/config/constants';
import type { TValueOf } from '@blog/config/utils';
import { TENANT_STATUS } from '@blog/db/constants';
import { mockTenantSanityCredentials } from '@blog/db/testing/tenant-sanity-credentials/fixtures';
import { mockTenant } from '@blog/db/testing/tenants/fixtures';

import type { TSanityValidationResult } from './lib/run-sanity-documents-validate';
import {
  DOCUMENT_VALIDATION_IDENTIFIER,
  hasSystemicFailures,
  runValidation,
  runValidationForTenant,
} from './run';

const { listActiveTenantsMock } = vi.hoisted(() => ({
  listActiveTenantsMock: vi.fn(),
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
  listActiveTenants: listActiveTenantsMock,
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

const MOCK_TENANT = mockTenant();
const MOCK_TENANTS = [MOCK_TENANT, mockTenant(), mockTenant()];
const MOCK_CREDENTIALS = mockTenantSanityCredentials();
const MOCK_FINDING_ID = 'finding-1';
const MOCK_DOCUMENT_TYPE = 'page_post';
const MOCK_DOCUMENT_ID = 'doc-1';

function invalidDocument(
  level: TSanityValidationResult['level'],
  documentId = MOCK_DOCUMENT_ID,
): TSanityValidationResult {
  return { documentId, documentType: MOCK_DOCUMENT_TYPE, level, markers: [] };
}

function openedFinding(id: string, isNewlyOpened: boolean) {
  return { ok: true, data: { finding: { id }, isNewlyOpened } };
}

function openFindingFrom(
  source: TValueOf<typeof FINDING_SOURCE>,
  kind: TValueOf<typeof FINDING_KIND>,
) {
  return {
    id: MOCK_FINDING_ID,
    tenantId: MOCK_TENANT.id,
    source,
    kind,
    status: FINDING_STATUS.OPEN,
  };
}

beforeEach(() => {
  listActiveTenantsMock.mockReset().mockResolvedValue([]);
  getTenantByIdMock.mockReset();
  getTenantSanityCredentialsMock
    .mockReset()
    .mockResolvedValue(MOCK_CREDENTIALS);
  validateTenantDocumentsMock.mockReset().mockReturnValue([]);
  listFindingsForTenantMock.mockReset().mockResolvedValue([]);
  openFindingMock
    .mockReset()
    .mockImplementation(() =>
      Promise.resolve(openedFinding(MOCK_FINDING_ID, true)),
    );
  resolveFindingMock
    .mockReset()
    .mockResolvedValue({ ok: true, data: { id: MOCK_FINDING_ID } });
  notifyMock.mockReset().mockResolvedValue(undefined);
});

describe(runValidation, () => {
  it('is a clean no-op when there are no in-scope tenants', async () => {
    const summary = await runValidation();

    expect(summary).toEqual({
      checked: 0,
      clean: 0,
      warning: 0,
      critical: 0,
      skipped: 0,
      errors: 0,
    });
  });

  describe('with three active tenants', () => {
    beforeEach(() => {
      listActiveTenantsMock.mockResolvedValue(MOCK_TENANTS);
    });

    it('tallies clean, warning and critical outcomes across tenants', async () => {
      validateTenantDocumentsMock
        .mockReturnValueOnce([])
        .mockReturnValueOnce([invalidDocument('warning')])
        .mockReturnValueOnce([invalidDocument('error', 'doc-2')]);

      const summary = await runValidation();

      expect(summary).toEqual({
        checked: 3,
        clean: 1,
        warning: 1,
        critical: 1,
        skipped: 0,
        errors: 0,
      });
    });

    it("one tenant's failure does not abort the sweep for the rest", async () => {
      validateTenantDocumentsMock
        .mockReturnValueOnce([])
        .mockImplementationOnce(() => {
          throw new Error('sanity CLI crashed');
        })
        .mockReturnValueOnce([]);

      const summary = await runValidation();

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
  });

  it('notifies operators only when the finding is newly opened, not on a repeat open', async () => {
    listActiveTenantsMock.mockResolvedValue(MOCK_TENANTS.slice(0, 2));
    validateTenantDocumentsMock.mockReturnValue([invalidDocument('warning')]);
    openFindingMock
      .mockResolvedValueOnce(openedFinding('f1', true))
      .mockResolvedValueOnce(openedFinding('f2', false));

    await runValidation();

    expect(notifyMock).toHaveBeenCalledTimes(1);
  });

  describe('with one active tenant', () => {
    beforeEach(() => {
      listActiveTenantsMock.mockResolvedValue([MOCK_TENANT]);
    });

    it.each([
      ['has no Sanity credentials yet', undefined],
      [
        'resolves to a non-ACTIVE status',
        { ...MOCK_CREDENTIALS, status: TENANT_STATUS.SUSPENDED },
      ],
      [
        'resolves to a deprovisioned timestamp',
        {
          ...MOCK_CREDENTIALS,
          deprovisionedAt: new Date('2026-01-02T00:00:00.000Z'),
        },
      ],
    ])('tallies a tenant that %s as skipped', async (_case, resolved) => {
      getTenantSanityCredentialsMock.mockResolvedValue(resolved);

      const summary = await runValidation();

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

    it('opens a finding for a tenant with invalid documents', async () => {
      const invalidDocuments = [invalidDocument('error')];
      validateTenantDocumentsMock.mockReturnValue(invalidDocuments);

      await runValidation();

      expect(openFindingMock).toHaveBeenCalledWith({
        tenantId: MOCK_TENANT.id,
        source: FINDING_SOURCE.DOCUMENT_VALIDATION,
        kind: FINDING_KIND.SCHEMA_VALIDATION_ERROR,
        severity: FINDING_SEVERITY.CRITICAL,
        identifier: DOCUMENT_VALIDATION_IDENTIFIER,
        details: {
          invalidDocumentCount: invalidDocuments.length,
          documents: invalidDocuments,
        },
      });
    });

    describe('when the tenant validates clean', () => {
      beforeEach(() => {
        validateTenantDocumentsMock.mockReturnValue([]);
      });

      it('resolves a previously open finding once the tenant validates clean again', async () => {
        listFindingsForTenantMock.mockResolvedValue([
          openFindingFrom(
            FINDING_SOURCE.DOCUMENT_VALIDATION,
            FINDING_KIND.SCHEMA_VALIDATION_ERROR,
          ),
        ]);

        await runValidation();

        expect(resolveFindingMock).toHaveBeenCalledWith(MOCK_FINDING_ID);
      });

      it('does not resolve an open finding from a different source/kind', async () => {
        listFindingsForTenantMock.mockResolvedValue([
          openFindingFrom(
            FINDING_SOURCE.RECHECK_TENANT_OWNERS,
            FINDING_KIND.OWNER_CHECK_STALLED,
          ),
        ]);

        await runValidation();

        expect(resolveFindingMock).not.toHaveBeenCalled();
      });
    });
  });
});

describe(runValidationForTenant, () => {
  it('validates only the given tenant', async () => {
    getTenantByIdMock.mockResolvedValue(MOCK_TENANT);

    const summary = await runValidationForTenant(MOCK_TENANT.id);

    expect(summary.checked).toBe(1);
    expect(getTenantByIdMock).toHaveBeenCalledWith(MOCK_TENANT.id);
    expect(listActiveTenantsMock).not.toHaveBeenCalled();
  });

  it('returns an empty summary when the tenant id does not resolve', async () => {
    getTenantByIdMock.mockResolvedValue(undefined);

    const summary = await runValidationForTenant('missing');

    expect(summary.checked).toBe(0);
    expect(validateTenantDocumentsMock).not.toHaveBeenCalled();
  });
});

describe(hasSystemicFailures, () => {
  it.each([
    ['false when every candidate resolved to an expected outcome', 0, false],
    ['true when at least one candidate threw', 1, true],
  ])('is %s', (_case, errors, expected) => {
    expect(
      hasSystemicFailures({
        checked: 3,
        clean: 2,
        warning: 0,
        critical: 0,
        skipped: 0,
        errors,
      }),
    ).toBe(expected);
  });
});
