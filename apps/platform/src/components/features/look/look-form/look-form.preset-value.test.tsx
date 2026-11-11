import { LOOK_ROW } from '@platform/constants/look-row';
import messages from '@platform/i18n/messages/en.json';
import { ARIA_PRESSED } from '@platform/testing/aria';
import { screen, within } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import {
  chooseSegment,
  openLookRow,
} from '@platform/testing/look/look-form-interactions';
import { setupLookForm } from '@platform/testing/look/look-form-setup';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { LookForm } from './look-form';

vi.mock('@platform/server/site-config/update-look-action');

vi.mock('@platform/server/site-config/upload-brand-asset-action');

vi.mock('@platform/server/site-config/clear-brand-asset-action');

const { lookForm: LOOK_FORM } = messages;

const usePresetValueName = (field: string) =>
  makeEnTranslator('lookForm')('usePresetValueAriaLabel', { field });

describe(`<${LookForm.name}/> Use preset value`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    setupLookForm();
  });

  it.each([
    {
      row: LOOK_ROW.BUTTONS,
      label: LOOK_FORM.buttonShapeLabel,
      chosen: LOOK_FORM.buttonShapeOptionLabel.SQUARE,
      preset: LOOK_FORM.buttonShapeOptionLabel.ROUNDED,
    },
    {
      row: LOOK_ROW.HEADER,
      label: LOOK_FORM.navLinkStyleLabel,
      chosen: LOOK_FORM.navLinkStyleOptionLabel.PILL,
      preset: LOOK_FORM.navLinkStyleOptionLabel.PLAIN,
    },
  ])(
    'puts $label back to the preset value',
    async ({ row, label, chosen, preset }) => {
      await openLookRow(user, row);
      await chooseSegment(user, label, chosen);
      const usePresetButton = screen.getByRole('button', {
        name: usePresetValueName(label),
      });

      await user.click(usePresetButton);

      const group = screen.getByRole('group', { name: label });
      const presetButton = within(group).getByRole('button', { name: preset });
      expect(presetButton).toHaveAttribute(ARIA_PRESSED, 'true');
    },
  );
});
