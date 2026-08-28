import { classifyProvisioningError } from './provisioning-error';

describe(classifyProvisioningError, () => {
  it('classifies a 403 permission failure', () => {
    const rawError =
      'Sanity Access API POST /access/project/xxxxx000/invites failed: 403 {"statusCode":403,"error":"Forbidden","message":"Missing permission to invite administrators."}';

    expect(classifyProvisioningError(rawError)).toBe('permission');
  });

  it('classifies a 400 duplicate/already-in-use failure', () => {
    const rawError =
      'Sanity Access API POST /access/project/xxxxx000/invites failed: 400 {"statusCode":400,"error":"Bad Request","message":"This email is already a member of another project."}';

    expect(classifyProvisioningError(rawError)).toBe('duplicate');
  });

  it('classifies a network/timeout failure', () => {
    expect(classifyProvisioningError('fetch failed')).toBe('network');
    expect(
      classifyProvisioningError(
        'AbortError: The operation was aborted due to timeout',
      ),
    ).toBe('network');
    expect(classifyProvisioningError('connect ECONNRESET 127.0.0.1:443')).toBe(
      'network',
    );
  });

  it('falls back to unknown for an unrecognised failure shape', () => {
    expect(classifyProvisioningError('CORS API is down')).toBe('unknown');
    expect(classifyProvisioningError('Access API is down')).toBe('unknown');
  });

  it('falls back to unknown when there is no raw error text', () => {
    expect(classifyProvisioningError(undefined)).toBe('unknown');
    expect(classifyProvisioningError('')).toBe('unknown');
  });

  it('does not classify a plain 400 with no duplicate keyword as a duplicate', () => {
    const rawError =
      'Vercel API POST /v10/projects/abc/domains failed: 400 {"error":{"code":"invalid_domain","message":"Domain is not valid."}}';

    expect(classifyProvisioningError(rawError)).toBe('unknown');
  });
});
