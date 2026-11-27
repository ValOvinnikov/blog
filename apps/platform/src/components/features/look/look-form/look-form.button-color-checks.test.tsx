import { ARIA_ATTRIBUTE } from '@platform/constants/aria-attribute';
import { LOOK_ROW } from '@platform/constants/look-row';
import messages from '@platform/i18n/messages/en.json';
import { updateLookAction } from '@platform/server/site-config/update-look-action';
import { screen } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import {
  hexInputs,
  pickButtonColor,
} from '@platform/testing/look/look-button-color';
import {
  clickSave,
  openLookRow,
} from '@platform/testing/look/look-form-interactions';
import { saveAndExpectLook } from '@platform/testing/look/look-form-save';
import { setupLookForm } from '@platform/testing/look/look-form-setup';
import { BRAND_VARIANT, COLOR_SCHEME } from '@shinefold/config';
import {
  MOCK_PARTIAL_HEX,
  MOCK_WHITE_HEX,
} from '@shinefold/config/testing/button-colors';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { LookForm } from './look-form';

vi.mock('@platform/server/site-config/update-look-action');

vi.mock('@platform/server/site-config/upload-brand-asset-action');

vi.mock('@platform/server/site-config/clear-brand-asset-action');

const { lookForm: LOOK_FORM } = messages;
const tLookForm = makeEnTranslator('lookForm');
const FAINT_ON_PLAIN_LIGHT = tLookForm('buttonColorFaintGround', {
  skin: LOOK_FORM.skinLabel[BRAND_VARIANT.PRIMARY],
  scheme: COLOR_SCHEME.LIGHT,
});

describe(`<${LookForm.name}/>`, () => {
  let user: UserEvent;

  beforeEach(async () => {
    user = userEvent.setup();
    setupLookForm();
    await openLookRow(user, LOOK_ROW.COLOUR);
  });

  describe('with a colour that is not a hex colour', () => {
    beforeEach(async () => {
      await pickButtonColor(user, MOCK_PARTIAL_HEX);
    });

    it('shows a field error', () => {
      const [hexInput] = hexInputs();
      const error = screen.getByText(LOOK_FORM.buttonColorInvalid);

      expect(error).toBeVisible();
      expect(hexInput).toHaveAttribute(ARIA_ATTRIBUTE.INVALID, 'true');
    });

    it('refuses to save', async () => {
      await clickSave(user);

      expect(updateLookAction).not.toHaveBeenCalled();
    });
  });

  describe('with a colour that is faint on a ground', () => {
    beforeEach(async () => {
      await pickButtonColor(user, MOCK_WHITE_HEX);
    });

    it('warns which ground the buttons are faint on', () => {
      const warning = screen.getByText(FAINT_ON_PLAIN_LIGHT, {
        exact: false,
      });

      expect(warning).toBeVisible();
    });

    it('still saves', async () => {
      await saveAndExpectLook(user, { buttonColor: MOCK_WHITE_HEX });
    });
  });
});
