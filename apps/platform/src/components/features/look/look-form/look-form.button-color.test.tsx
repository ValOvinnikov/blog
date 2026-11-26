import { LOOK_ROW } from '@platform/constants/look-row';
import { SITE_THEME_BUTTON_STYLE_TEST_ID } from '@platform/constants/site-theme-frame';
import messages from '@platform/i18n/messages/en.json';
import { updateLookAction } from '@platform/server/site-config/update-look-action';
import { screen } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import {
  BUTTON_COLOR_DARK_FOLLOWS,
  BUTTON_COLOR_FOLLOWS_ACCENT,
  followSwitch,
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
  MOCK_PINK_HEX,
  MOCK_WHITE_HEX,
  MOCK_YELLOW_HEX,
} from '@shinefold/config/testing/button-colors';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { LookForm } from './look-form';

vi.mock('@platform/server/site-config/update-look-action');

vi.mock('@platform/server/site-config/upload-brand-asset-action');

vi.mock('@platform/server/site-config/clear-brand-asset-action');

const { lookForm: LOOK_FORM } = messages;
const tLookForm = makeEnTranslator('lookForm');
const PARTIAL_HEX = MOCK_YELLOW_HEX.slice(0, -1);
const FAINT_ON_PLAIN_LIGHT = tLookForm('buttonColorFaintGround', {
  skin: LOOK_FORM.skinLabel[BRAND_VARIANT.PRIMARY],
  scheme: COLOR_SCHEME.LIGHT,
});

const buttonStyles = () =>
  screen.queryAllByTestId(SITE_THEME_BUTTON_STYLE_TEST_ID);

describe(`<${LookForm.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  describe('on Growth', () => {
    beforeEach(async () => {
      setupLookForm();
      await openLookRow(user, LOOK_ROW.BUTTONS);
    });

    it('keeps the buttons on the accent until a colour is picked', () => {
      const accentSwitch = followSwitch(BUTTON_COLOR_FOLLOWS_ACCENT);

      expect(accentSwitch).toBeChecked();
      expect(buttonStyles()).toHaveLength(0);
    });

    describe('with a colour picked', () => {
      beforeEach(async () => {
        await pickButtonColor(user, MOCK_YELLOW_HEX);
      });

      it('previews it on every button', () => {
        const [buttonStyle] = buttonStyles();

        expect(buttonStyle).toHaveTextContent(MOCK_YELLOW_HEX);
      });

      it('previews a picked dark-ground colour', async () => {
        const darkSwitch = followSwitch(BUTTON_COLOR_DARK_FOLLOWS);
        await user.click(darkSwitch);
        const [, darkHexInput] = hexInputs();
        await user.clear(darkHexInput!);
        await user.type(darkHexInput!, MOCK_PINK_HEX);

        const [buttonStyle] = buttonStyles();
        expect(buttonStyle).toHaveTextContent(MOCK_PINK_HEX);
      });

      it('returns the preview to the accent when the colour is cleared', async () => {
        const accentSwitch = followSwitch(BUTTON_COLOR_FOLLOWS_ACCENT);

        await user.click(accentSwitch);

        expect(buttonStyles()).toHaveLength(0);
      });

      it('saves it', async () => {
        await saveAndExpectLook(user, { buttonColor: MOCK_YELLOW_HEX });
      });
    });

    describe('with a colour that is not a hex colour', () => {
      beforeEach(async () => {
        await pickButtonColor(user, PARTIAL_HEX);
      });

      it('shows a field error', () => {
        const [hexInput] = hexInputs();
        const error = screen.getByText(LOOK_FORM.buttonColorInvalid);

        expect(error).toBeVisible();
        expect(hexInput).toHaveAttribute('aria-invalid', 'true');
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
});
