import {
  ESCAPED_UNSAFE_MARKUP,
  TEST_TENANT_ID,
  TEST_TENANT_NAME,
  UNSAFE_MARKUP,
} from '@blog/email/testing/email-fixtures';

import { buildOwnerElevationAlertEmail } from './owner-elevation-alert';

const ALERT = {
  tenantName: TEST_TENANT_NAME,
  tenantId: TEST_TENANT_ID,
  outcome: 'STALLED',
} as const;

describe('buildOwnerElevationAlertEmail', () => {
  it('escapes the tenant name', () => {
    const { html } = buildOwnerElevationAlertEmail({
      ...ALERT,
      tenantName: UNSAFE_MARKUP,
    });

    expect(html).not.toContain(UNSAFE_MARKUP);
    expect(html).toContain(`<strong>${ESCAPED_UNSAFE_MARKUP}</strong>`);
  });

  it('escapes the tenant id', () => {
    const { html } = buildOwnerElevationAlertEmail({
      ...ALERT,
      tenantId: UNSAFE_MARKUP,
    });

    expect(html).not.toContain(UNSAFE_MARKUP);
    expect(html).toContain(`<code>${ESCAPED_UNSAFE_MARKUP}</code>`);
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
