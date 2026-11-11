import { TENANT_PLAN } from '@blog/db/constants';
import { LOOK_ROW } from '@platform/constants/look-row';
import messages from '@platform/i18n/messages/en.json';
import { ARIA_DISABLED } from '@platform/testing/aria';
import { screen } from '@platform/testing/custom-render';
import {
  FOOTER_LAYOUT_LABEL,
  GROWTH_BADGE_TEXT,
  HEADER_LAYOUT_LABEL,
  SPINNER_LABEL,
} from '@platform/testing/look/look-form-fixtures';
import { openLookRow } from '@platform/testing/look/look-form-interactions';
import {
  setupLookForm,
  withLookTenant,
} from '@platform/testing/look/look-form-setup';
import { expectStyleGroupLockedAtDefault } from '@platform/testing/look/look-free-locks';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { LookForm } from './look-form';

vi.mock('@platform/components/features/look/look-preview');

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
      setupLookForm(withLookTenant({ plan: TENANT_PLAN.FREE }));
    });

    it.each([
      {
        row: LOOK_ROW.BUTTONS,
        group: LOOK_FORM.buttonShapeLabel,
        current: LOOK_FORM.buttonShapeOptionLabel.ROUNDED,
        other: LOOK_FORM.buttonShapeOptionLabel.PILL,
      },
      {
        row: LOOK_ROW.BUTTONS,
        group: LOOK_FORM.busyButtonStyleLabel,
        current: LOOK_FORM.busyButtonStyleOptionLabel.LABEL,
        other: LOOK_FORM.busyButtonStyleOptionLabel.EDGE,
      },
      {
        row: LOOK_ROW.FOOTER,
        group: FOOTER_LAYOUT_LABEL,
        current: LOOK_FORM.footerLayoutOptionLabel.COLUMNS,
        other: LOOK_FORM.footerLayoutOptionLabel.CENTRED,
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
    ])('shows $group locked at its default', async (lockedGroup) => {
      await expectStyleGroupLockedAtDefault(user, lockedGroup);
    });

    it.each([
      {
        row: LOOK_ROW.HEADER,
        label: HEADER_LAYOUT_LABEL,
        current: LOOK_FORM.headerLayoutOptionLabel.CLASSIC,
        hint: LOOK_FORM.headerLayoutDescription,
      },
      {
        row: LOOK_ROW.BUTTONS,
        label: SPINNER_LABEL,
        current: LOOK_FORM.spinnerStyleOptionLabel.BRAILLE,
        hint: LOOK_FORM.spinnerStyleDescription,
      },
    ])(
      'shows $label as a locked select that keeps its value shut',
      async ({ row, label, current, hint }) => {
        await openLookRow(user, row);
        const select = screen.getByRole('combobox', {
          name: `${label} ${GROWTH_BADGE_TEXT} ${current}`,
        });

        await user.click(select);

        const listbox = screen.queryByRole('listbox');
        expect(select).toHaveAttribute(ARIA_DISABLED, 'true');
        expect(select).toHaveAccessibleDescription(
          `${GROWTH_BADGE_TEXT} ${hint}`,
        );
        expect(listbox).not.toBeInTheDocument();
      },
    );
  });
});
