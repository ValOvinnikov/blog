import { LOOK_FIELD_LABEL_TEST_ID } from '@platform/constants/look-form';
import { LOOK_ROW } from '@platform/constants/look-row';
import messages from '@platform/i18n/messages/en.json';
import { grantEntitlementAction } from '@platform/server/entitlement-grants/grant-entitlement-action';
import { ARIA_DISABLED } from '@platform/testing/aria';
import { screen, waitFor, within } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import {
  CONSOLE,
  GROWTH,
  GROWTH_BADGE_TEXT,
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
  MOCK_TENANT_CREATED_AT,
  MOCK_TENANT_NAME,
  mockGrantAccess,
  mockGrantTarget,
} from '@platform/testing/tenants/fixtures';
import { formatDate } from '@platform/utils/format-date/format-date';
import { ACTION_OUTCOME, LOCALE_ISO_CODES } from '@shinefold/config';
import { TENANT_PLAN } from '@shinefold/config/constants';
import { LOOK_FIELD, PLAN_ENTITLEMENTS } from '@shinefold/db/constants';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { LookForm } from './look-form';

vi.mock('@platform/server/site-config/update-look-action');

vi.mock('@platform/server/site-config/upload-brand-asset-action');

vi.mock('@platform/server/site-config/clear-brand-asset-action');

vi.mock('@platform/server/entitlement-grants/grant-entitlement-action');

const { lookForm: LOOK_FORM, grantedBadge } = messages;
const tGrant = makeEnTranslator('grantEntitlement');
const tLookForm = makeEnTranslator('lookForm');
const FREE_LOOK_FIELDS = PLAN_ENTITLEMENTS[TENANT_PLAN.FREE].lookFields;
const RADIUS_SCALE = LOOK_FORM.radiusScaleLabel;
const DENSITY = LOOK_FORM.densityLabel;
const GROWTH_FIELDS_LINE = tLookForm('lockLineGrowthFields', {
  preset: CONSOLE,
});
const grantTrigger = (field: string) => ({
  name: tGrant('triggerAriaLabel', { item: field }),
});
const GRANT_ANYTHING = { name: new RegExp(tGrant('trigger')) };

describe(`<${LookForm.name}/> grants`, () => {
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

  describe('with Radius scale granted on Free', () => {
    beforeEach(async () => {
      setupLookForm(
        withLookTenant({
          lookFields: [...FREE_LOOK_FIELDS, LOOK_FIELD.RADIUS_SCALE],
          grants: mockGrantAccess({
            granted: { [LOOK_FIELD.RADIUS_SCALE]: { expiresAt: null } },
          }),
        }),
      );
      await openLookRow(user, LOOK_ROW.SHAPE);
    });

    it('says Granted in place of the Growth badge and leaves the control live', () => {
      const granted = screen.getByText(grantedBadge.label);
      const radiusScale = screen.getByRole('group', { name: RADIUS_SCALE });
      const noneButton = within(radiusScale).getByRole('button', {
        name: LOOK_FORM.radiusScaleOptionLabel.NONE,
      });

      expect(granted).toBeVisible();
      expect(noneButton).not.toHaveAttribute(ARIA_DISABLED);
    });

    it('keeps the Growth badge on a field that is not granted', () => {
      const densityGroup = screen.getByRole('group', {
        name: `${DENSITY} ${GROWTH_BADGE_TEXT}`,
      });

      expect(densityGroup).toBeVisible();
    });

    it('keeps the card lock line while another field stays locked', () => {
      const shapeCard = screen.getByRole('group', {
        name: LOOK_FORM.shapeHeading,
      });
      const lockLine = within(shapeCard).getByText(GROWTH_FIELDS_LINE);

      expect(lockLine).toBeVisible();
    });
  });

  it('says until when a granted field lasts', async () => {
    setupLookForm(
      withLookTenant({
        lookFields: [...FREE_LOOK_FIELDS, LOOK_FIELD.RADIUS_SCALE],
        grants: mockGrantAccess({
          granted: {
            [LOOK_FIELD.RADIUS_SCALE]: { expiresAt: MOCK_TENANT_CREATED_AT },
          },
        }),
      }),
    );
    await openLookRow(user, LOOK_ROW.SHAPE);

    const granted = screen.getByText(
      makeEnTranslator('grantedBadge')('labelUntil', {
        date: formatDate(MOCK_TENANT_CREATED_AT, LOCALE_ISO_CODES.EN),
      }),
    );

    expect(granted).toBeVisible();
  });
});
