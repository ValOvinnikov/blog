import { ELEVATE_TENANT_OWNER_OUTCOME } from '@blog/db/constants';

import { ownerElevationTone } from './status-tone';

// Only `ownerElevationTone` is covered here — the other exported tone
// functions in this file (`tenantStatusTone`, `provisioningStepTone`,
// `domainVerificationTone`) predate this coverage and are a pre-existing
// gap, not one this test adds.
describe(ownerElevationTone, () => {
  it('is "ok" for ELEVATED', () => {
    expect(ownerElevationTone(ELEVATE_TENANT_OWNER_OUTCOME.ELEVATED)).toBe(
      'ok',
    );
  });

  it('is "ok" for ALREADY_ADMINISTRATOR', () => {
    expect(
      ownerElevationTone(ELEVATE_TENANT_OWNER_OUTCOME.ALREADY_ADMINISTRATOR),
    ).toBe('ok');
  });

  it('is "neutral" for PENDING_ACCEPTANCE', () => {
    expect(
      ownerElevationTone(ELEVATE_TENANT_OWNER_OUTCOME.PENDING_ACCEPTANCE),
    ).toBe('neutral');
  });

  it('is "warn" for STALLED', () => {
    expect(ownerElevationTone(ELEVATE_TENANT_OWNER_OUTCOME.STALLED)).toBe(
      'warn',
    );
  });

  it('is "warn" for AMBIGUOUS_MEMBERSHIP', () => {
    expect(
      ownerElevationTone(ELEVATE_TENANT_OWNER_OUTCOME.AMBIGUOUS_MEMBERSHIP),
    ).toBe('warn');
  });
});
