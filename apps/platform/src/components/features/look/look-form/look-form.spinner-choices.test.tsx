import { SPINNER_STYLE } from '@blog/config';
import { LOOK_ROW } from '@platform/constants/look-row';
import messages from '@platform/i18n/messages/en.json';
import { screen } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { SPINNER_LABEL } from '@platform/testing/look/look-form-fixtures';
import {
  chooseOption,
  chooseSegment,
  openLookRow,
} from '@platform/testing/look/look-form-interactions';
import { saveAndExpectLook } from '@platform/testing/look/look-form-save';
import { setupLookForm } from '@platform/testing/look/look-form-setup';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { LookForm } from './look-form';

vi.mock('@platform/server/site-config/update-look-action');

vi.mock('@platform/server/site-config/upload-brand-asset-action');

vi.mock('@platform/server/site-config/clear-brand-asset-action');

const { lookForm: LOOK_FORM } = messages;

const USE_PRESET_SPINNER = makeEnTranslator('lookForm')(
  'usePresetValueAriaLabel',
  { field: SPINNER_LABEL },
);
const UNSAVED_SPINNER = `${SPINNER_LABEL} ${LOOK_FORM.fieldUnsavedLabel}`;
const UNSAVED_BUSY_STYLE = `${LOOK_FORM.busyButtonStyleLabel} ${LOOK_FORM.fieldUnsavedLabel}`;

describe(`<${LookForm.name}/> spinner`, () => {
  let user: UserEvent;

  beforeEach(async () => {
    user = userEvent.setup();
    setupLookForm();
    await openLookRow(user, LOOK_ROW.BUTTONS);
  });

  it('saves the chosen spinner', async () => {
    await chooseOption(
      user,
      SPINNER_LABEL,
      LOOK_FORM.spinnerStyleOptionLabel.DOTS,
    );

    await saveAndExpectLook(user, { spinnerStyle: SPINNER_STYLE.DOTS });
  });

  describe('after choosing the Dots spinner', () => {
    beforeEach(async () => {
      await chooseOption(
        user,
        SPINNER_LABEL,
        LOOK_FORM.spinnerStyleOptionLabel.DOTS,
      );
    });

    it('hides the spinner while busy buttons draw a progress edge and brings it back with its value', async () => {
      await chooseSegment(
        user,
        LOOK_FORM.busyButtonStyleLabel,
        LOOK_FORM.busyButtonStyleOptionLabel.EDGE,
      );
      const hiddenSpinner = screen.queryByRole('combobox', {
        name: UNSAVED_SPINNER,
      });
      expect(hiddenSpinner).not.toBeInTheDocument();

      await chooseSegment(
        user,
        UNSAVED_BUSY_STYLE,
        LOOK_FORM.busyButtonStyleOptionLabel.KEPT,
      );

      const spinner = screen.getByRole('combobox', { name: UNSAVED_SPINNER });
      expect(spinner).toHaveTextContent(LOOK_FORM.spinnerStyleOptionLabel.DOTS);
    });

    it("puts the spinner back to the preset's", async () => {
      const usePresetSpinnerButton = screen.getByRole('button', {
        name: USE_PRESET_SPINNER,
      });

      await user.click(usePresetSpinnerButton);

      const spinner = screen.getByRole('combobox', { name: SPINNER_LABEL });
      expect(spinner).toHaveTextContent(
        LOOK_FORM.spinnerStyleOptionLabel.BRAILLE,
      );
    });
  });
});
