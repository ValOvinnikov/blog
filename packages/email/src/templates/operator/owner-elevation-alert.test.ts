import { buildOwnerElevationAlertEmail } from './owner-elevation-alert';

describe('buildOwnerElevationAlertEmail', () => {
  it('escapes the tenant name', () => {
    const { html } = buildOwnerElevationAlertEmail({
      tenantName: '<script>alert(1)</script>',
      tenantId: 'tenant_1',
      outcome: 'STALLED',
    });

    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('names the tenant in the subject', () => {
    const { subject } = buildOwnerElevationAlertEmail({
      tenantName: 'Acme',
      tenantId: 'tenant_1',
      outcome: 'STALLED',
    });

    expect(subject).toBe(
      'Tenant "Acme" (tenant_1) needs owner-elevation attention',
    );
  });

  it('uses distinct copy per outcome', () => {
    const stalled = buildOwnerElevationAlertEmail({
      tenantName: 'Acme',
      tenantId: 'tenant_1',
      outcome: 'STALLED',
    });
    const ambiguous = buildOwnerElevationAlertEmail({
      tenantName: 'Acme',
      tenantId: 'tenant_1',
      outcome: 'AMBIGUOUS_MEMBERSHIP',
    });

    expect(stalled.html).not.toEqual(ambiguous.html);
    expect(stalled.html).toContain("hasn't accepted their Sanity invite");
    expect(ambiguous.html).toContain('more than one human member');
  });
});
