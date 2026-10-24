import {
  MOCK_ESCAPED_UNSAFE_MARKUP,
  MOCK_SIGN_IN_URL,
  MOCK_TENANT_ID,
  MOCK_TENANT_NAME,
  MOCK_UNSAFE_MARKUP,
} from '@blog/email/testing/email-fixtures';

import { buildInactivityWarningAlertEmail } from './inactivity-warning-alert';

describe(buildInactivityWarningAlertEmail, () => {
  let email: ReturnType<typeof buildInactivityWarningAlertEmail>;

  beforeEach(() => {
    email = buildInactivityWarningAlertEmail({
      tenantName: MOCK_TENANT_NAME,
      tenantId: MOCK_TENANT_ID,
      ownerEmail: 'owner@acme.example.com',
      pauseDate: '28 October 2026',
      signInUrl: MOCK_SIGN_IN_URL,
    });
  });

  it('names the tenant and the pause date in the subject', () => {
    expect(email.subject).toBe(
      'Tenant "Northwind" (tenant_1) will be paused on 28 October 2026',
    );
  });

  it('names the tenant, its owner and the pause date in the body', () => {
    expect(email.html).toContain(
      '<p>Tenant Northwind (id tenant_1) has had no sign-in for a while and will be paused on 28 October 2026.</p><p>Its owner, owner@acme.example.com, has been sent the same warning.</p>',
    );
  });

  it('links to the platform sign-in', () => {
    expect(email.html).toContain(`href="${MOCK_SIGN_IN_URL}"`);
    expect(email.html).toContain('>Open the platform admin panel</a>');
  });

  it('carries the same copy and link as plain text', () => {
    expect(email.text).toBe(
      `Tenant Northwind (id tenant_1) has had no sign-in for a while and will be paused on 28 October 2026.\n\nIts owner, owner@acme.example.com, has been sent the same warning.\n\nOpen the platform admin panel: ${MOCK_SIGN_IN_URL}`,
    );
  });

  it('escapes every caller-supplied value in the HTML', () => {
    const { html } = buildInactivityWarningAlertEmail({
      tenantName: MOCK_UNSAFE_MARKUP,
      tenantId: MOCK_UNSAFE_MARKUP,
      ownerEmail: MOCK_UNSAFE_MARKUP,
      pauseDate: MOCK_UNSAFE_MARKUP,
      signInUrl: MOCK_SIGN_IN_URL,
    });

    expect(html).not.toContain(MOCK_UNSAFE_MARKUP);
    expect(html).toContain(MOCK_ESCAPED_UNSAFE_MARKUP);
  });
});
