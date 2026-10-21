import {
  ESCAPED_UNSAFE_MARKUP,
  TEST_TENANT_ID,
  TEST_TENANT_NAME,
  UNSAFE_MARKUP,
} from '@blog/email/testing/email-fixtures';

import { buildDocumentValidationAlertEmail } from './document-validation-alert';

const ALERT = {
  tenantName: TEST_TENANT_NAME,
  tenantId: TEST_TENANT_ID,
  invalidDocumentCount: 2,
  isCritical: false,
};

describe('buildDocumentValidationAlertEmail', () => {
  it('escapes the tenant name', () => {
    const { html } = buildDocumentValidationAlertEmail({
      ...ALERT,
      tenantName: UNSAFE_MARKUP,
    });

    expect(html).not.toContain(UNSAFE_MARKUP);
    expect(html).toContain(`<strong>${ESCAPED_UNSAFE_MARKUP}</strong>`);
  });

  it('escapes the tenant id', () => {
    const { html } = buildDocumentValidationAlertEmail({
      ...ALERT,
      tenantId: UNSAFE_MARKUP,
    });

    expect(html).not.toContain(UNSAFE_MARKUP);
    expect(html).toContain(`<code>${ESCAPED_UNSAFE_MARKUP}</code>`);
  });

  it('names the tenant in the subject', () => {
    const { subject } = buildDocumentValidationAlertEmail(ALERT);

    expect(subject).toBe(
      'Tenant "Northwind" (tenant_1) has invalid Sanity documents',
    );
  });

  it('uses distinct copy per severity', () => {
    const critical = buildDocumentValidationAlertEmail({
      ...ALERT,
      isCritical: true,
    });
    const warning = buildDocumentValidationAlertEmail(ALERT);

    expect(critical.html).not.toEqual(warning.html);
    expect(critical.html).toContain(
      'at least one document fails schema validation with an error-level marker',
    );
    expect(warning.html).toContain(
      'documents have warning-level schema validation markers',
    );
  });

  it('includes the invalid document count in the body', () => {
    const { html } = buildDocumentValidationAlertEmail({
      ...ALERT,
      invalidDocumentCount: 5,
    });

    expect(html).toContain('5 document(s) failed validation');
  });
});
