import { buildDocumentValidationAlertEmail } from './document-validation-alert';

describe('buildDocumentValidationAlertEmail', () => {
  it('escapes the tenant name', () => {
    const { html } = buildDocumentValidationAlertEmail({
      tenantName: '<script>alert(1)</script>',
      tenantId: 'tenant_1',
      invalidDocumentCount: 2,
      isCritical: false,
    });

    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('names the tenant in the subject', () => {
    const { subject } = buildDocumentValidationAlertEmail({
      tenantName: 'Acme',
      tenantId: 'tenant_1',
      invalidDocumentCount: 2,
      isCritical: false,
    });

    expect(subject).toBe(
      'Tenant "Acme" (tenant_1) has invalid Sanity documents',
    );
  });

  it('uses distinct copy per severity', () => {
    const critical = buildDocumentValidationAlertEmail({
      tenantName: 'Acme',
      tenantId: 'tenant_1',
      invalidDocumentCount: 3,
      isCritical: true,
    });
    const warning = buildDocumentValidationAlertEmail({
      tenantName: 'Acme',
      tenantId: 'tenant_1',
      invalidDocumentCount: 3,
      isCritical: false,
    });

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
      tenantName: 'Acme',
      tenantId: 'tenant_1',
      invalidDocumentCount: 5,
      isCritical: true,
    });

    expect(html).toContain('5 document(s) failed validation');
  });
});
