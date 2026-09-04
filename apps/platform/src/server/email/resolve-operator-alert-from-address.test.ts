import { resolveOperatorAlertFromAddress } from './resolve-operator-alert-from-address';

describe(resolveOperatorAlertFromAddress, () => {
  it('falls back to the Resend shared testing sender when unset', () => {
    expect(resolveOperatorAlertFromAddress(undefined)).toBe(
      'Tenant Alerts <onboarding@resend.dev>',
    );
  });

  it('uses the configured address when set', () => {
    expect(
      resolveOperatorAlertFromAddress(
        'Tenant Alerts <alerts@mail.example.com>',
      ),
    ).toBe('Tenant Alerts <alerts@mail.example.com>');
  });
});
