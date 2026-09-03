import { FINDING_SEVERITY } from '@blog/config/constants';
import { ELEVATE_TENANT_OWNER_OUTCOME } from '@blog/db/constants';

import {
  findingSeverityTone,
  ownerElevationTone,
  sanityValidationMarkerTone,
} from './status-tone';

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

describe(findingSeverityTone, () => {
  it('is "neutral" for INFO', () => {
    expect(findingSeverityTone(FINDING_SEVERITY.INFO)).toBe('neutral');
  });

  it('is "warn" for WARNING', () => {
    expect(findingSeverityTone(FINDING_SEVERITY.WARNING)).toBe('warn');
  });

  it('is "bad" for CRITICAL', () => {
    expect(findingSeverityTone(FINDING_SEVERITY.CRITICAL)).toBe('bad');
  });
});

describe(sanityValidationMarkerTone, () => {
  it('is "bad" for error', () => {
    expect(sanityValidationMarkerTone('error')).toBe('bad');
  });

  it('is "warn" for warning', () => {
    expect(sanityValidationMarkerTone('warning')).toBe('warn');
  });

  it('is "neutral" for info', () => {
    expect(sanityValidationMarkerTone('info')).toBe('neutral');
  });
});
