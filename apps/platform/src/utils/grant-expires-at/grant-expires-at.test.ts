import { ENTITLEMENT_GRANT_EXPIRY } from '@platform/constants/entitlement-grant';

import { grantExpiresAt } from './grant-expires-at';

const GRANTED_AT = new Date('2026-11-18T10:00:00.000Z');

describe(grantExpiresAt, () => {
  it('sets no expiry for a grant that never expires', () => {
    expect(
      grantExpiresAt(ENTITLEMENT_GRANT_EXPIRY.NEVER, GRANTED_AT),
    ).toBeNull();
  });

  it.each([
    [ENTITLEMENT_GRANT_EXPIRY.DAYS_30, '2026-12-18T10:00:00.000Z'],
    [ENTITLEMENT_GRANT_EXPIRY.DAYS_90, '2027-02-16T10:00:00.000Z'],
    [ENTITLEMENT_GRANT_EXPIRY.YEAR_1, '2027-11-18T10:00:00.000Z'],
  ])('ends a %s grant at the grant time plus its period', (expiry, endsAt) => {
    expect(grantExpiresAt(expiry, GRANTED_AT)).toEqual(new Date(endsAt));
  });
});
