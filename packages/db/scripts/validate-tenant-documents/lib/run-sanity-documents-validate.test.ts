import { execFileSync } from 'node:child_process';

import {
  MOCK_TENANT_MIGRATE_CLI_ENV,
  MOCK_TENANT_MIGRATE_PARAMS,
} from '@blog/db/testing/migrate-tenant-content/fixtures';
import { mockSanityValidationResult } from '@blog/db/testing/validate-tenant-documents/fixtures';
import { faker } from '@faker-js/faker';

import { validateTenantDocuments } from './run-sanity-documents-validate';

vi.mock('node:child_process');

faker.seed(5801);

const MOCK_CLI_FAILURE = faker.lorem.sentence();

beforeEach(() => {
  vi.mocked(execFileSync).mockReturnValue('[]');
});

describe(validateTenantDocuments, () => {
  it('parses the JSON array printed on a clean exit', () => {
    expect(validateTenantDocuments(MOCK_TENANT_MIGRATE_PARAMS)).toEqual([]);
  });

  it('overrides the per-tenant Sanity env vars for the CLI invocation', () => {
    validateTenantDocuments(MOCK_TENANT_MIGRATE_PARAMS);

    const [command, args, options] =
      vi.mocked(execFileSync).mock.lastCall ?? [];

    expect({ command, args, env: options?.env }).toEqual({
      command: 'pnpm',
      args: [
        'exec',
        'sanity',
        'documents',
        'validate',
        '--yes',
        '--format',
        'json',
      ],
      env: { ...process.env, ...MOCK_TENANT_MIGRATE_CLI_ENV },
    });
  });

  it('parses invalid documents reported on a clean exit', () => {
    const results = [mockSanityValidationResult({ level: 'warning' })];
    vi.mocked(execFileSync).mockReturnValue(JSON.stringify(results));

    expect(validateTenantDocuments(MOCK_TENANT_MIGRATE_PARAMS)).toEqual(
      results,
    );
  });

  it('parses the captured stdout when the CLI exits non-zero on an error marker', () => {
    const results = [mockSanityValidationResult({ level: 'error' })];
    vi.mocked(execFileSync).mockImplementation(() => {
      throw Object.assign(new Error(MOCK_CLI_FAILURE), {
        status: 1,
        stdout: JSON.stringify(results),
      });
    });

    expect(validateTenantDocuments(MOCK_TENANT_MIGRATE_PARAMS)).toEqual(
      results,
    );
  });

  it('rethrows a systemic failure that produced no captured stdout', () => {
    const error = new Error(MOCK_CLI_FAILURE);
    vi.mocked(execFileSync).mockImplementation(() => {
      throw error;
    });

    expect(() => validateTenantDocuments(MOCK_TENANT_MIGRATE_PARAMS)).toThrow(
      error,
    );
  });
});
