import { DATA_REQUEST_MATCH_KIND } from '@platform/constants/data-request';
import {
  MOCK_DATA_REQUEST_EMAIL,
  MOCK_DATA_REQUEST_SITE_NAME,
  mockPersonalDataMatches,
} from '@platform/testing/data-requests/fixtures';

import { toDataRequestMatches } from './to-data-request-matches';

describe(toDataRequestMatches, () => {
  it('lists one row per stored record, grouped by kind', () => {
    const matches = toDataRequestMatches(mockPersonalDataMatches());

    expect(matches.map(({ kind }) => kind)).toEqual([
      DATA_REQUEST_MATCH_KIND.SUBSCRIBER,
      DATA_REQUEST_MATCH_KIND.LEAD,
      DATA_REQUEST_MATCH_KIND.INVITE,
      DATA_REQUEST_MATCH_KIND.SIGNUP_BLOCK,
      DATA_REQUEST_MATCH_KIND.AUDIT_EVENT,
    ]);
  });

  it('names the site of a per-site record and none for a platform record', () => {
    const matches = toDataRequestMatches(mockPersonalDataMatches());

    expect(matches.map(({ siteName }) => siteName)).toEqual([
      MOCK_DATA_REQUEST_SITE_NAME,
      MOCK_DATA_REQUEST_SITE_NAME,
      MOCK_DATA_REQUEST_SITE_NAME,
      undefined,
      undefined,
    ]);
  });

  it('shows no email for a sign-up block, which holds only a hash', () => {
    const [, , , block, auditEvent] = toDataRequestMatches(
      mockPersonalDataMatches(),
    );

    expect(block?.email).toBeUndefined();
    expect(auditEvent?.email).toBe(MOCK_DATA_REQUEST_EMAIL);
  });

  it('keys rows apart even when two tables share an id', () => {
    const matches = toDataRequestMatches(mockPersonalDataMatches());

    expect(new Set(matches.map(({ key }) => key)).size).toBe(matches.length);
  });
});
