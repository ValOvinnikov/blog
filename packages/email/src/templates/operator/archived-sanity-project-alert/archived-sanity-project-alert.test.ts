import {
  MOCK_ESCAPED_UNSAFE_MARKUP,
  MOCK_TENANT_ID,
  MOCK_TENANT_NAME,
  MOCK_UNSAFE_MARKUP,
} from '@blog/email/testing/email-fixtures';

import { buildArchivedSanityProjectAlertEmail } from './archived-sanity-project-alert';

const SANITY_PROJECT_ID = 'abc123';
const MANAGE_URL = 'https://www.sanity.io/manage/project/abc123';

describe(buildArchivedSanityProjectAlertEmail, () => {
  let email: ReturnType<typeof buildArchivedSanityProjectAlertEmail>;

  beforeEach(() => {
    email = buildArchivedSanityProjectAlertEmail({
      tenantName: MOCK_TENANT_NAME,
      tenantId: MOCK_TENANT_ID,
      sanityProjectId: SANITY_PROJECT_ID,
      manageUrl: MANAGE_URL,
    });
  });

  it('names the tenant in the subject', () => {
    expect(email.subject).toBe(
      'Delete the archived Sanity project of tenant "Northwind" (tenant_1)',
    );
  });

  it('names the tenant and the archived project in the body', () => {
    expect(email.html).toContain(
      '<p>Tenant Northwind (id tenant_1) has been deprovisioned. Its Sanity project abc123 is archived, not deleted.</p><p>Delete the project in Sanity Manage. Deprovisioning cannot delete it for you.</p>',
    );
  });

  it('links to the project in Sanity Manage', () => {
    expect(email.html).toContain(`href="${MANAGE_URL}"`);
    expect(email.html).toContain('>Open the project in Sanity Manage</a>');
  });

  it('carries the same copy and link as plain text', () => {
    expect(email.text).toBe(
      `Tenant Northwind (id tenant_1) has been deprovisioned. Its Sanity project abc123 is archived, not deleted.\n\nDelete the project in Sanity Manage. Deprovisioning cannot delete it for you.\n\nOpen the project in Sanity Manage: ${MANAGE_URL}`,
    );
  });

  it('escapes every caller-supplied value in the HTML', () => {
    const { html } = buildArchivedSanityProjectAlertEmail({
      tenantName: MOCK_UNSAFE_MARKUP,
      tenantId: MOCK_UNSAFE_MARKUP,
      sanityProjectId: MOCK_UNSAFE_MARKUP,
      manageUrl: MANAGE_URL,
    });

    expect(html).not.toContain(MOCK_UNSAFE_MARKUP);
    expect(html).toContain(MOCK_ESCAPED_UNSAFE_MARKUP);
  });
});
