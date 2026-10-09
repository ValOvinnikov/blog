import { FINDING_SEVERITY } from '@blog/config/constants';

import { findingSeverityTone, sanityValidationMarkerTone } from './status-tone';

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
