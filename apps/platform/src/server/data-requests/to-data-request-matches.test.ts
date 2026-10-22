import { DATA_REQUEST_MATCH_KIND } from '@platform/constants/data-request';
import {
  DATA_REQUEST_EMAIL,
  DATA_REQUEST_SITE_NAME,
  makePersonalDataMatches,
} from '@platform/testing/data-requests/fixtures';

import { toDataRequestMatches } from './to-data-request-matches';

describe(toDataRequestMatches, () => {
  it('lists one row per stored record, grouped by kind', () => {
    const matches = toDataRequestMatches(makePersonalDataMatches());

    expect(matches.map(({ kind }) => kind)).toEqual([
      DATA_REQUEST_MATCH_KIND.SUBSCRIBER,
      DATA_REQUEST_MATCH_KIND.LEAD,
      DATA_REQUEST_MATCH_KIND.INVITE,
      DATA_REQUEST_MATCH_KIND.SIGNUP_BLOCK,
      DATA_REQUEST_MATCH_KIND.AUDIT_EVENT,
    ]);
  });

  it('names the site of a per-site record and none for a platform record', () => {
    const matches = toDataRequestMatches(makePersonalDataMatches());

    expect(matches.map(({ siteName }) => siteName)).toEqual([
      DATA_REQUEST_SITE_NAME,
      DATA_REQUEST_SITE_NAME,
      DATA_REQUEST_SITE_NAME,
      undefined,
      undefined,
    ]);
  });

  it('shows no email for a sign-up block, which holds only a hash', () => {
    const [, , , block, auditEvent] = toDataRequestMatches(
      makePersonalDataMatches(),
    );

    expect(block?.email).toBeUndefined();
    expect(auditEvent?.email).toBe(DATA_REQUEST_EMAIL);
  });

  it('keys rows apart even when two tables share an id', () => {
    const matches = toDataRequestMatches(makePersonalDataMatches());

    expect(new Set(matches.map(({ key }) => key)).size).toBe(matches.length);
  });
});
