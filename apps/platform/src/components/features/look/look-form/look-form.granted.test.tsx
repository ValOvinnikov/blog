import { LOOK_ROW } from '@platform/constants/look-row';
import messages from '@platform/i18n/messages/en.json';
import { ARIA_DISABLED } from '@platform/testing/aria';
import { screen, within } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import {
  DENSITY,
  FREE_LOOK_FIELDS,
  GROWTH_BADGE_TEXT,
  GROWTH_FIELDS_LINE,
  RADIUS_SCALE,
} from '@platform/testing/look/look-form-fixtures';
import { openLookRow } from '@platform/testing/look/look-form-interactions';
import {
  setupLookForm,
  withLookTenant,
} from '@platform/testing/look/look-form-setup';
import {
  MOCK_TENANT_CREATED_AT,
  mockGrantAccess,
} from '@platform/testing/tenants/fixtures';
import { formatDate } from '@platform/utils/format-date/format-date';
import { LOCALE_ISO_CODES } from '@shinefold/config';
import { LOOK_FIELD } from '@shinefold/db/constants';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { LookForm } from './look-form';

vi.mock('@platform/server/site-config/update-look-action');

vi.mock('@platform/server/site-config/upload-brand-asset-action');

vi.mock('@platform/server/site-config/clear-brand-asset-action');

vi.mock('@platform/server/entitlement-grants/grant-entitlement-action');

const { lookForm: LOOK_FORM, grantedBadge } = messages;

describe(`<${LookForm.name}/> granted fields`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
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
