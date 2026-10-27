import {
  classifyProvisioningError,
  type TProvisioningErrorKind,
} from './provisioning-error';

const MOCK_INVITES_FAILURE_PREFIX =
  'Sanity Access API POST /access/project/xxxxx000/invites failed:';

describe(classifyProvisioningError, () => {
  it.each<{
    name: string;
    rawError: string | undefined;
    kind: TProvisioningErrorKind;
  }>([
    {
      name: 'a 403 permission failure',
      rawError: `${MOCK_INVITES_FAILURE_PREFIX} 403 {"statusCode":403,"error":"Forbidden","message":"Missing permission to invite administrators."}`,
      kind: 'permission',
    },
    {
      name: 'a 400 already-in-use failure',
      rawError: `${MOCK_INVITES_FAILURE_PREFIX} 400 {"statusCode":400,"error":"Bad Request","message":"This email is already a member of another project."}`,
      kind: 'duplicate',
    },
    { name: 'a failed fetch', rawError: 'fetch failed', kind: 'network' },
    {
      name: 'an aborted timeout',
      rawError: 'AbortError: The operation was aborted due to timeout',
      kind: 'network',
    },
    {
      name: 'a reset connection',
      rawError: 'connect ECONNRESET 127.0.0.1:443',
      kind: 'network',
    },
    {
      name: 'a CORS API outage',
      rawError: 'CORS API is down',
      kind: 'unknown',
    },
    {
      name: 'an Access API outage',
      rawError: 'Access API is down',
      kind: 'unknown',
    },
    {
      name: 'a plain 400 with no duplicate keyword',
      rawError:
        'Vercel API POST /v10/projects/abc/domains failed: 400 {"error":{"code":"invalid_domain","message":"Domain is not valid."}}',
      kind: 'unknown',
    },
    { name: 'missing error text', rawError: undefined, kind: 'unknown' },
    { name: 'empty error text', rawError: '', kind: 'unknown' },
  ])('classifies $name as $kind', ({ rawError, kind }) => {
    expect(classifyProvisioningError(rawError)).toBe(kind);
  });
});
