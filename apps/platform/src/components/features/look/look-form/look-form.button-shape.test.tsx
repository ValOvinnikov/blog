import { BUTTON_SHAPE } from '@blog/config';
import { LOOK_ROW } from '@platform/constants/look-row';
import messages from '@platform/i18n/messages/en.json';
import { ARIA_PRESSED } from '@platform/testing/aria';
import { screen, within } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import {
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

const SHAPE_LABEL = LOOK_FORM.buttonShapeLabel;
const USE_PRESET_SHAPE = makeEnTranslator('lookForm')(
  'usePresetValueAriaLabel',
  { field: SHAPE_LABEL },
);

describe(`<${LookForm.name}/> button shape`, () => {
  let user: UserEvent;

  beforeEach(async () => {
    user = userEvent.setup();
    setupLookForm();
    await openLookRow(user, LOOK_ROW.BUTTONS);
  });

  it('saves the chosen shape', async () => {
    await chooseSegment(
      user,
      SHAPE_LABEL,
      LOOK_FORM.buttonShapeOptionLabel.PILL,
    );

    await saveAndExpectLook(user, { buttonShape: BUTTON_SHAPE.PILL });
  });

  it('puts the shape back to the preset value', async () => {
    await chooseSegment(
      user,
      SHAPE_LABEL,
      LOOK_FORM.buttonShapeOptionLabel.SQUARE,
    );
    const usePresetShapeButton = screen.getByRole('button', {
      name: USE_PRESET_SHAPE,
    });

    await user.click(usePresetShapeButton);

    const group = screen.getByRole('group', { name: SHAPE_LABEL });
    const rounded = within(group).getByRole('button', {
      name: LOOK_FORM.buttonShapeOptionLabel.ROUNDED,
    });
    expect(rounded).toHaveAttribute(ARIA_PRESSED, 'true');
  });
});
