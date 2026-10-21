import {
  ESCAPED_UNSAFE_MARKUP,
  TEST_SIGN_IN_URL,
  TEST_TENANT_ID,
  TEST_TENANT_NAME,
  UNSAFE_MARKUP,
} from '@blog/email/testing/email-fixtures';

import { buildInactivityWarningAlertEmail } from './inactivity-warning-alert';

describe(buildInactivityWarningAlertEmail, () => {
  let email: ReturnType<typeof buildInactivityWarningAlertEmail>;

  beforeEach(() => {
    email = buildInactivityWarningAlertEmail({
      tenantName: TEST_TENANT_NAME,
      tenantId: TEST_TENANT_ID,
      ownerEmail: 'owner@acme.example.com',
      pauseDate: '28 October 2026',
      signInUrl: TEST_SIGN_IN_URL,
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
    expect(email.html).toContain(`href="${TEST_SIGN_IN_URL}"`);
    expect(email.html).toContain('>Open the platform admin panel</a>');
  });

  it('carries the same copy and link as plain text', () => {
    expect(email.text).toBe(
      `Tenant Northwind (id tenant_1) has had no sign-in for a while and will be paused on 28 October 2026.\n\nIts owner, owner@acme.example.com, has been sent the same warning.\n\nOpen the platform admin panel: ${TEST_SIGN_IN_URL}`,
    );
  });

  it('escapes every caller-supplied value in the HTML', () => {
    const { html } = buildInactivityWarningAlertEmail({
      tenantName: UNSAFE_MARKUP,
      tenantId: UNSAFE_MARKUP,
      ownerEmail: UNSAFE_MARKUP,
      pauseDate: UNSAFE_MARKUP,
      signInUrl: TEST_SIGN_IN_URL,
    });

    expect(html).not.toContain(UNSAFE_MARKUP);
    expect(html).toContain(ESCAPED_UNSAFE_MARKUP);
  });
});
