import { TENANT_PLAN } from '@blog/db/constants';
import { LOOK_ROW } from '@platform/constants/look-row';
import messages from '@platform/i18n/messages/en.json';
import { ARIA_PRESSED } from '@platform/testing/aria';
import { screen, within } from '@platform/testing/custom-render';
import { openLookRow } from '@platform/testing/look/look-form-interactions';
import { setupLookForm } from '@platform/testing/look/look-form-setup';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { LookForm } from './look-form';

vi.mock('@platform/server/site-config/update-look-action');

vi.mock('@platform/server/site-config/upload-brand-asset-action');

vi.mock('@platform/server/site-config/clear-brand-asset-action');

const { lookForm: LOOK_FORM } = messages;

describe(`<${LookForm.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  describe('on Free', () => {
    beforeEach(() => {
      setupLookForm({ plan: TENANT_PLAN.FREE });
    });
    it.each([
      {
        row: LOOK_ROW.HEADER,
        group: LOOK_FORM.headerBarStyleLabel,
        current: LOOK_FORM.headerBarStyleOptionLabel.FULL_WIDTH,
        other: LOOK_FORM.headerBarStyleOptionLabel.FLOATING,
      },
      {
        row: LOOK_ROW.HEADER,
        group: LOOK_FORM.accountButtonStyleLabel,
        current: LOOK_FORM.accountButtonStyleOptionLabel.PILL,
        other: LOOK_FORM.accountButtonStyleOptionLabel.CIRCLE,
      },
      {
        row: LOOK_ROW.HEADER,
        group: LOOK_FORM.accountPanelStyleLabel,
        current: LOOK_FORM.accountPanelStyleOptionLabel.CARD,
        other: LOOK_FORM.accountPanelStyleOptionLabel.HUB,
      },
      {
        row: LOOK_ROW.HEADER,
        group: LOOK_FORM.accountPhonePlacementLabel,
        current: LOOK_FORM.accountPhonePlacementOptionLabel.BAR,
        other: LOOK_FORM.accountPhonePlacementOptionLabel.MENU,
      },
      {
        row: LOOK_ROW.BUTTONS,
        group: LOOK_FORM.busyButtonStyleLabel,
        current: LOOK_FORM.busyButtonStyleOptionLabel.LABEL,
        other: LOOK_FORM.busyButtonStyleOptionLabel.EDGE,
      },
      {
        row: LOOK_ROW.FOOTER,
        group: LOOK_FORM.footerBackgroundLabel,
        current: LOOK_FORM.footerBackgroundOptionLabel.BRAND_PRIMARY,
        other: LOOK_FORM.footerBackgroundOptionLabel.SECONDARY,
      },
      {
        row: LOOK_ROW.FOOTER,
        group: LOOK_FORM.footerSurfaceLabel,
        current: LOOK_FORM.footerSurfaceOptionLabel.FULL_WIDTH,
        other: LOOK_FORM.footerSurfaceOptionLabel.CARD,
      },
    ])(
      'shows $group locked at its default',
      async ({ row, group, current, other }) => {
        await openLookRow(user, row);
        const styleGroup = screen.getByRole('group', { name: group });
        const currentButton = within(styleGroup).getByRole('button', {
          name: current,
        });
        const otherButton = within(styleGroup).getByRole('button', {
          name: other,
        });

        expect(currentButton).toHaveAttribute(ARIA_PRESSED, 'true');
        expect(otherButton).toBeDisabled();
      },
    );
  });
});
