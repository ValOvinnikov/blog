import { LOOK_FIELD_LABEL_TEST_ID } from '@platform/constants/look-form';
import { LOOK_ROW } from '@platform/constants/look-row';
import messages from '@platform/i18n/messages/en.json';
import { grantEntitlementAction } from '@platform/server/entitlement-grants/grant-entitlement-action';
import { screen, waitFor, within } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import {
  DENSITY,
  FREE_LOOK_FIELDS,
  GROWTH,
  GROWTH_FIELDS_LINE,
  RADIUS_SCALE,
} from '@platform/testing/look/look-form-fixtures';
import {
  lookRowTrigger,
  openLookRow,
} from '@platform/testing/look/look-form-interactions';
import {
  setupLookForm,
  withLookTenant,
} from '@platform/testing/look/look-form-setup';
import {
  MOCK_TENANT_NAME,
  mockGrantAccess,
  mockGrantTarget,
} from '@platform/testing/tenants/fixtures';
import { ACTION_OUTCOME } from '@shinefold/config';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { LookForm } from './look-form';

vi.mock('@platform/server/site-config/update-look-action');

vi.mock('@platform/server/site-config/upload-brand-asset-action');

vi.mock('@platform/server/site-config/clear-brand-asset-action');

vi.mock('@platform/server/entitlement-grants/grant-entitlement-action');

const { lookForm: LOOK_FORM } = messages;
const tGrant = makeEnTranslator('grantEntitlement');
const grantTrigger = (field: string) => ({
  name: tGrant('triggerAriaLabel', { item: field }),
});
const GRANT_ANYTHING = { name: new RegExp(tGrant('trigger')) };

describe(`<${LookForm.name}/> grant offers`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  describe('for a super admin on Free', () => {
    let radiusGrant: HTMLElement;

    beforeEach(async () => {
      setupLookForm({
        ...withLookTenant({
          lookFields: FREE_LOOK_FIELDS,
          grants: mockGrantAccess({ target: mockGrantTarget() }),
        }),
        isOperator: true,
      });
      await openLookRow(user, LOOK_ROW.SHAPE);
      radiusGrant = screen.getByRole('button', grantTrigger(RADIUS_SCALE));
    });

    it('offers a grant on each locked field of Corners & spacing', () => {
      const densityGrant = screen.getByRole('button', grantTrigger(DENSITY));

      expect(radiusGrant).toBeVisible();
      expect(densityGrant).toBeVisible();
    });

    it('keeps the card lock line beside the grants', () => {
      const shapeCard = screen.getByRole('group', {
        name: LOOK_FORM.shapeHeading,
      });
      const lockLine = within(shapeCard).getByText(GROWTH_FIELDS_LINE);

      expect(lockLine).toBeVisible();
    });

    it('keeps the closed-row Growth badge on a row whose every field is locked', () => {
      const typeRow = lookRowTrigger(LOOK_ROW.TYPE);
      const badge = within(typeRow).getByText(GROWTH);

      expect(badge).toBeVisible();
    });

    it('moves focus to the field once it is granted', async () => {
      vi.mocked(grantEntitlementAction).mockResolvedValueOnce({
        outcome: ACTION_OUTCOME.SUCCESS,
      });
      await user.click(radiusGrant);
      const confirm = await screen.findByRole('button', {
        name: messages.grantDialog.confirmButton,
      });
      await user.click(confirm);

      const radiusField = screen
        .getAllByTestId(LOOK_FIELD_LABEL_TEST_ID)
        .find((row) => within(row).queryByText(RADIUS_SCALE));

      await waitFor(() => expect(radiusField).toHaveFocus());
    });

    it('opens the grant dialog naming the field and the tenant', async () => {
      await user.click(radiusGrant);

      const dialog = await screen.findByRole('alertdialog', {
        name: tGrant('title', {
          item: RADIUS_SCALE,
          tenant: MOCK_TENANT_NAME,
        }),
      });

      expect(dialog).toBeVisible();
    });
  });

  it('offers no grant to anyone who cannot grant', async () => {
    setupLookForm(withLookTenant({ lookFields: FREE_LOOK_FIELDS }));
    await openLookRow(user, LOOK_ROW.SHAPE);

    const grants = screen.queryAllByRole('button', GRANT_ANYTHING);

    expect(grants).toHaveLength(0);
  });
});
