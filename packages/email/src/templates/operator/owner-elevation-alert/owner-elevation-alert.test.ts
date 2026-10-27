import {
  MOCK_ESCAPED_UNSAFE_MARKUP,
  MOCK_TENANT_ID,
  MOCK_TENANT_NAME,
  MOCK_UNSAFE_MARKUP,
} from '@blog/email/testing/email-fixtures';

import {
  buildOwnerElevationAlertEmail,
  type TOwnerElevationAlertInput,
} from './owner-elevation-alert';

const MOCK_ALERT: TOwnerElevationAlertInput = {
  tenantName: MOCK_TENANT_NAME,
  tenantId: MOCK_TENANT_ID,
  outcome: 'STALLED',
};

describe(buildOwnerElevationAlertEmail, () => {
  it.each([
    [
      'tenant name',
      'tenantName',
      `<strong>${MOCK_ESCAPED_UNSAFE_MARKUP}</strong>`,
    ],
    ['tenant id', 'tenantId', `<code>${MOCK_ESCAPED_UNSAFE_MARKUP}</code>`],
  ] as const)('escapes the %s', (_name, key, expected) => {
    const { html } = buildOwnerElevationAlertEmail({
      ...MOCK_ALERT,
      [key]: MOCK_UNSAFE_MARKUP,
    });

    expect(html).not.toContain(MOCK_UNSAFE_MARKUP);
    expect(html).toContain(expected);
  });

  it('names the tenant and its id in the subject', () => {
    const { subject } = buildOwnerElevationAlertEmail(MOCK_ALERT);

    expect(subject).toContain(MOCK_TENANT_NAME);
    expect(subject).toContain(MOCK_TENANT_ID);
  });

  it('words a stalled elevation differently from an ambiguous membership', () => {
    const stalled = buildOwnerElevationAlertEmail(MOCK_ALERT);
    const ambiguous = buildOwnerElevationAlertEmail({
      ...MOCK_ALERT,
      outcome: 'AMBIGUOUS_MEMBERSHIP',
    });

    expect(stalled.html).not.toBe(ambiguous.html);
  });
});
