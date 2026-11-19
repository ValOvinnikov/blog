import { LOOK_ROW } from '@platform/constants/look-row';
import messages from '@platform/i18n/messages/en.json';
import { screen } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { openLookRow } from '@platform/testing/look/look-form-interactions';
import { setupLookPageContent as setup } from '@platform/testing/look/look-page-content-setup';
import { mockOperatorViewer } from '@platform/testing/memberships/fixtures';
import {
  mockEntitlementGrant,
  mockReadyTenant,
  mockTenant,
} from '@platform/testing/tenants/fixtures';
import { TENANT_PLAN } from '@shinefold/config/constants';
import {
  ADMIN_ROLE,
  ENTITLEMENT_KIND,
  LOOK_FIELD,
} from '@shinefold/db/constants';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { LookPageContent } from './look-page-content';

vi.mock(
  '@shinefold/db',
  () => import('@platform/testing/site-config/site-config-db'),
);

vi.mock('@platform/server/settings-features/get-enabled-capabilities');

vi.mock('@platform/utils/env/env');

const { radiusScaleOptionLabel: RADIUS_LABEL } = messages.lookForm;

describe(`<${LookPageContent.name}/> grants on a Free tenant`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

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
