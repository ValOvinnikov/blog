import {
  FINDING_KIND,
  FINDING_SEVERITY,
  FINDING_SOURCE,
  FINDING_STATUS,
} from '@blog/config/constants';
import type { TValueOf } from '@blog/config/utils';
import { TENANT_STATUS } from '@blog/db/constants';
import { mockTenantSanityCredentials } from '@blog/db/testing/tenant-sanity-credentials/fixtures';
import {
  MOCK_MISSING_TENANT_ID,
  mockTenant,
} from '@blog/db/testing/tenants/fixtures';
import { mockSanityValidationResult } from '@blog/db/testing/validate-tenant-documents/fixtures';
import { faker } from '@faker-js/faker';

import {
  DOCUMENT_VALIDATION_IDENTIFIER,
  hasSystemicFailures,
  runValidation,
  runValidationForTenant,
  type TValidateSummary,
} from './run';

const {
  listActiveTenantsMock,
  getTenantByIdMock,
  getTenantSanityCredentialsMock,
  validateTenantDocumentsMock,
  listFindingsForTenantMock,
  openFindingMock,
  resolveFindingMock,
  notifyMock,
} = vi.hoisted(() => ({
  listActiveTenantsMock: vi.fn(),
  getTenantByIdMock: vi.fn(),
  getTenantSanityCredentialsMock: vi.fn(),
  validateTenantDocumentsMock: vi.fn(),
  listFindingsForTenantMock: vi.fn(),
  openFindingMock: vi.fn(),
  resolveFindingMock: vi.fn(),
  notifyMock: vi.fn(),
}));

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

faker.seed(5803);

const MOCK_TENANT = mockTenant();
const MOCK_TENANTS = [MOCK_TENANT, mockTenant(), mockTenant()];
const MOCK_CREDENTIALS = mockTenantSanityCredentials();
const MOCK_FINDING_ID = faker.string.uuid();
const MOCK_DEPROVISIONED_AT = faker.date.past();
const MOCK_VALIDATE_CRASH = faker.lorem.sentence();
const MOCK_EMPTY_SUMMARY: TValidateSummary = {
  checked: 0,
  clean: 0,
  warning: 0,
  critical: 0,
  skipped: 0,
  errors: 0,
};

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
  listActiveTenantsMock.mockResolvedValue([]);
  getTenantSanityCredentialsMock.mockResolvedValue(MOCK_CREDENTIALS);
  validateTenantDocumentsMock.mockReturnValue([]);
  listFindingsForTenantMock.mockResolvedValue([]);
  openFindingMock.mockResolvedValue(openedFinding(MOCK_FINDING_ID, true));
  resolveFindingMock.mockResolvedValue({
    ok: true,
    data: { id: MOCK_FINDING_ID },
  });
  notifyMock.mockResolvedValue(undefined);
});

describe(runValidation, () => {
  it('is a clean no-op when there are no in-scope tenants', async () => {
    const summary = await runValidation();

    expect(summary).toEqual(MOCK_EMPTY_SUMMARY);
  });

  describe('with three active tenants', () => {
    beforeEach(() => {
      listActiveTenantsMock.mockResolvedValue(MOCK_TENANTS);
    });

    it('tallies clean, warning and critical outcomes across tenants', async () => {
      validateTenantDocumentsMock
        .mockReturnValueOnce([])
        .mockReturnValueOnce([mockSanityValidationResult({ level: 'warning' })])
        .mockReturnValueOnce([mockSanityValidationResult({ level: 'error' })]);

      const summary = await runValidation();

      expect(summary).toEqual({
        ...MOCK_EMPTY_SUMMARY,
        checked: 3,
        clean: 1,
        warning: 1,
        critical: 1,
      });
    });

    it("one tenant's failure does not abort the sweep for the rest", async () => {
      validateTenantDocumentsMock
        .mockReturnValueOnce([])
        .mockImplementationOnce(() => {
          throw new Error(MOCK_VALIDATE_CRASH);
        })
        .mockReturnValueOnce([]);

      const summary = await runValidation();

      expect(summary).toEqual({
        ...MOCK_EMPTY_SUMMARY,
        checked: 3,
        clean: 2,
        errors: 1,
      });
      expect(validateTenantDocumentsMock).toHaveBeenCalledTimes(3);
      expect(hasSystemicFailures(summary)).toBe(true);
    });
  });

  it('notifies operators once per newly opened finding, not on a repeat', async () => {
    listActiveTenantsMock.mockResolvedValue(MOCK_TENANTS.slice(0, 2));
    validateTenantDocumentsMock.mockReturnValue([
      mockSanityValidationResult({ level: 'warning' }),
    ]);
    openFindingMock
      .mockResolvedValueOnce(openedFinding(faker.string.uuid(), true))
      .mockResolvedValueOnce(openedFinding(faker.string.uuid(), false));

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
        { ...MOCK_CREDENTIALS, deprovisionedAt: MOCK_DEPROVISIONED_AT },
      ],
    ])('tallies a tenant that %s as skipped', async (_case, resolved) => {
      getTenantSanityCredentialsMock.mockResolvedValue(resolved);

      const summary = await runValidation();

      expect(summary).toEqual({
        ...MOCK_EMPTY_SUMMARY,
        checked: 1,
        skipped: 1,
      });
      expect(validateTenantDocumentsMock).not.toHaveBeenCalled();
    });

    it('opens a finding for a tenant with invalid documents', async () => {
      const invalidDocuments = [mockSanityValidationResult({ level: 'error' })];
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
      it('resolves a previously open finding', async () => {
        listFindingsForTenantMock.mockResolvedValue([
          openFindingFrom(
            FINDING_SOURCE.DOCUMENT_VALIDATION,
            FINDING_KIND.SCHEMA_VALIDATION_ERROR,
          ),
        ]);

        await runValidation();

        expect(resolveFindingMock).toHaveBeenCalledWith(MOCK_FINDING_ID);
      });

      it('leaves an open finding from a different source and kind', async () => {
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

    const summary = await runValidationForTenant(MOCK_MISSING_TENANT_ID);

    expect(summary.checked).toBe(0);
    expect(validateTenantDocumentsMock).not.toHaveBeenCalled();
  });
});

describe(hasSystemicFailures, () => {
  it.each([
    ['false when every candidate resolved to an expected outcome', 0, false],
    ['true when at least one candidate threw', 1, true],
  ])('is %s', (_case, errors, expected) => {
    const summary = { ...MOCK_EMPTY_SUMMARY, checked: 3, clean: 2, errors };

    expect(hasSystemicFailures(summary)).toBe(expected);
  });
});
