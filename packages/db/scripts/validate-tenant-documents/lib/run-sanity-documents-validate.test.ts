import { validateTenantDocuments } from './run-sanity-documents-validate';

const { execFileSyncMock } = vi.hoisted(() => ({ execFileSyncMock: vi.fn() }));

vi.mock('node:child_process', () => ({ execFileSync: execFileSyncMock }));

const params = {
  projectId: 'proj-1',
  dataset: 'production',
  token: 'read-token',
};

beforeEach(() => {
  execFileSyncMock.mockReset();
});

describe(validateTenantDocuments, () => {
  it('parses the JSON array printed on a clean exit', () => {
    execFileSyncMock.mockReturnValue('[]');

    expect(validateTenantDocuments(params)).toEqual([]);
  });

  it('overrides the per-tenant Sanity env vars for the CLI invocation', () => {
    execFileSyncMock.mockReturnValue('[]');

    validateTenantDocuments(params);

    expect(execFileSyncMock).toHaveBeenCalledWith(
      'pnpm',
      ['exec', 'sanity', 'documents', 'validate', '--yes', '--format', 'json'],
      expect.objectContaining({
        env: expect.objectContaining({
          SANITY_STUDIO_PROJECT_ID: 'proj-1',
          SANITY_STUDIO_DATASET: 'production',
          SANITY_AUTH_TOKEN: 'read-token',
        }),
      }),
    );
  });

  it('parses invalid documents reported on a clean exit', () => {
    const results = [
      {
        documentId: 'doc-1',
        documentType: 'blog_post',
        level: 'warning',
        markers: [{ level: 'warning', message: 'Missing SEO title' }],
      },
    ];
    execFileSyncMock.mockReturnValue(JSON.stringify(results));

    expect(validateTenantDocuments(params)).toEqual(results);
  });

  it('still parses the captured stdout when the CLI exits non-zero for an error-level marker', () => {
    const results = [
      {
        documentId: 'doc-1',
        documentType: 'blog_post',
        level: 'error',
        markers: [{ level: 'error', message: 'Required field is missing' }],
      },
    ];
    execFileSyncMock.mockImplementation(() => {
      throw Object.assign(new Error('Command failed'), {
        status: 1,
        stdout: JSON.stringify(results),
      });
    });

    expect(validateTenantDocuments(params)).toEqual(results);
  });

  it('rethrows a systemic failure that produced no captured stdout', () => {
    const error = new Error('ENOENT: pnpm not found');
    execFileSyncMock.mockImplementation(() => {
      throw error;
    });

    expect(() => validateTenantDocuments(params)).toThrow(error);
  });
});
