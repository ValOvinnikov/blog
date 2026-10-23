import {
  MOCK_ESCAPED_UNSAFE_MARKUP,
  MOCK_TENANT_ID,
  MOCK_TENANT_NAME,
  MOCK_UNSAFE_MARKUP,
} from '@blog/email/testing/email-fixtures';

import { buildOwnerElevationAlertEmail } from './owner-elevation-alert';

const ALERT = {
  tenantName: MOCK_TENANT_NAME,
  tenantId: MOCK_TENANT_ID,
  outcome: 'STALLED',
} as const;

describe('buildOwnerElevationAlertEmail', () => {
  it('escapes the tenant name', () => {
    const { html } = buildOwnerElevationAlertEmail({
      ...ALERT,
      tenantName: MOCK_UNSAFE_MARKUP,
    });

    expect(html).not.toContain(MOCK_UNSAFE_MARKUP);
    expect(html).toContain(`<strong>${MOCK_ESCAPED_UNSAFE_MARKUP}</strong>`);
  });

  it('escapes the tenant id', () => {
    const { html } = buildOwnerElevationAlertEmail({
      ...ALERT,
      tenantId: MOCK_UNSAFE_MARKUP,
    });

    expect(html).not.toContain(MOCK_UNSAFE_MARKUP);
    expect(html).toContain(`<code>${MOCK_ESCAPED_UNSAFE_MARKUP}</code>`);
  });

  describe('for a stalled elevation', () => {
    let stalled: ReturnType<typeof buildOwnerElevationAlertEmail>;

    beforeEach(() => {
      stalled = buildOwnerElevationAlertEmail(ALERT);
    });

    it('names the tenant in the subject', () => {
      expect(stalled.subject).toBe(
        'Tenant "Northwind" (tenant_1) needs owner-elevation attention',
      );
    });

    it('uses distinct copy per outcome', () => {
      const ambiguous = buildOwnerElevationAlertEmail({
        ...ALERT,
        outcome: 'AMBIGUOUS_MEMBERSHIP',
      });

      expect(stalled.html).not.toEqual(ambiguous.html);
      expect(stalled.html).toContain("hasn't accepted their Sanity invite");
      expect(ambiguous.html).toContain('more than one human member');
    });
  });
});
