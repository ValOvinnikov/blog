import { ARIA_ATTRIBUTE } from '@platform/constants/aria-attribute';
import { LOOK_ROW } from '@platform/constants/look-row';
import { LOOK_SAMPLE_TOKENS_TEST_ID } from '@platform/constants/look-sample';
import messages from '@platform/i18n/messages/en.json';
import { screen } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { openLookRow } from '@platform/testing/look/look-form-interactions';
import {
  arrangeLookPageQueries,
  setupLookPageContent as setup,
} from '@platform/testing/look/look-page-content-setup';
import {
  getSiteConfigMock,
  selectLiveLocalesMock,
} from '@platform/testing/look/look-page-db';
import { mockOperatorViewer } from '@platform/testing/memberships/fixtures';
import { mockSiteConfig } from '@platform/testing/site-config/fixtures';
import {
  mockReadyTenant,
  mockTenant,
} from '@platform/testing/tenants/fixtures';
import { RADIUS_SCALE } from '@shinefold/config';
import { TENANT_PLAN } from '@shinefold/config/constants';
import {
  ADMIN_ROLE,
  ENTITLEMENT_KIND,
  LOOK_FIELD,
} from '@shinefold/db/constants';
import { mockEntitlementGrant } from '@shinefold/db/testing/tenant-entitlement-grants/mock-entitlement-grant';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { LookPageContent } from './look-page-content';

vi.mock('@shinefold/db', async () =>
  (await import('@platform/testing/look/look-page-db')).mockLookPageDb(),
);

vi.mock('@platform/server/settings-features/get-enabled-capabilities');

vi.mock('@platform/utils/env/env');

const { radiusScaleOptionLabel: RADIUS_LABEL } = messages.lookForm;

describe(`<${LookPageContent.name}/> grants and Growth-only values`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    arrangeLookPageQueries({
      getSiteConfig: getSiteConfigMock,
      selectLiveLocalesWithin: selectLiveLocalesMock,
    });
  });

  describe('with a stored Growth-only corner radius', () => {
    beforeEach(() => {
      getSiteConfigMock.mockResolvedValue(
        mockSiteConfig({ radiusScale: RADIUS_SCALE.XL }),
      );
    });

    it("shows and previews the preset's radius on Free", async () => {
      await setup({ tenant: mockReadyTenant({ plan: TENANT_PLAN.FREE }) });
      await openLookRow(user, LOOK_ROW.SHAPE);

      const presetRadius = screen.getByRole('button', {
        name: RADIUS_LABEL.MD,
      });
      const sampleTokens = screen.getByTestId(LOOK_SAMPLE_TOKENS_TEST_ID);
      expect(presetRadius).toHaveAttribute(ARIA_ATTRIBUTE.PRESSED, 'true');
      expect(presetRadius).toHaveAttribute(ARIA_ATTRIBUTE.DISABLED, 'true');
      expect(sampleTokens).not.toHaveStyle({ '--radius-md': '16px' });
    });

    it('shows and previews the stored radius on Growth', async () => {
      await setup({ tenant: mockReadyTenant({ plan: TENANT_PLAN.GROWTH }) });
      await openLookRow(user, LOOK_ROW.SHAPE);

      const storedRadius = screen.getByRole('button', {
        name: RADIUS_LABEL.XL,
      });
      const sampleTokens = screen.getByTestId(LOOK_SAMPLE_TOKENS_TEST_ID);
      expect(storedRadius).toHaveAttribute(ARIA_ATTRIBUTE.PRESSED, 'true');
      expect(storedRadius).toBeEnabled();
      expect(sampleTokens).toHaveStyle({ '--radius-md': '16px' });
    });
  });

  describe('grants on a Free tenant', () => {
    const GRANT_RADIUS_SCALE = {
      name: makeEnTranslator('grantEntitlement')('triggerAriaLabel', {
        item: messages.lookForm.radiusScaleLabel,
      }),
    };

    it('offers a super admin the grant on a locked field', async () => {
      await setup({
        tenant: mockReadyTenant({ plan: TENANT_PLAN.FREE }),
        viewer: mockOperatorViewer(ADMIN_ROLE.SUPERADMIN),
        canGrantEntitlements: true,
      });
      await openLookRow(user, LOOK_ROW.SHAPE);

      const grant = screen.getByRole('button', GRANT_RADIUS_SCALE);

      expect(grant).toBeVisible();
    });

    it('offers a super admin no grant outside the operator tenant pages', async () => {
      await setup({
        tenant: mockReadyTenant({ plan: TENANT_PLAN.FREE }),
        viewer: mockOperatorViewer(ADMIN_ROLE.SUPERADMIN),
      });
      await openLookRow(user, LOOK_ROW.SHAPE);

      const grant = screen.queryByRole('button', GRANT_RADIUS_SCALE);

      expect(grant).not.toBeInTheDocument();
    });

    it('unlocks a granted field and says it is granted', async () => {
      await setup({
        tenant: mockTenant({ plan: TENANT_PLAN.FREE }, [
          mockEntitlementGrant({
            kind: ENTITLEMENT_KIND.LOOK_FIELD,
            key: LOOK_FIELD.RADIUS_SCALE,
          }),
        ]),
      });
      await openLookRow(user, LOOK_ROW.SHAPE);

      const noneRadius = screen.getByRole('button', {
        name: RADIUS_LABEL.NONE,
      });
      const granted = screen.getByText(messages.grantedBadge.label);

      expect(noneRadius).toBeEnabled();
      expect(granted).toBeVisible();
    });
  });
});
