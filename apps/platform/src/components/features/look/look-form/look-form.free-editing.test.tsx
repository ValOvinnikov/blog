import { COOKIE_SETTINGS_BUTTON } from '@blog/config';
import { TENANT_PLAN } from '@blog/config/constants';
import { LOOK_ROW } from '@platform/constants/look-row';
import { LOOK_SAMPLE_TOKENS_TEST_ID } from '@platform/constants/look-sample';
import messages from '@platform/i18n/messages/en.json';
import { ARIA_DISABLED, ARIA_PRESSED } from '@platform/testing/aria';
import { screen, within } from '@platform/testing/custom-render';
import { USER_EVENT_KEY } from '@platform/testing/keyboard';
import {
  ACCENT_HUE,
  EDITORIAL,
  EXTRA_LARGE,
  FOLLOW_ACCENT_HUE,
  GROWTH_BADGE_TEXT,
  OUTLINED,
} from '@platform/testing/look/look-form-fixtures';
import {
  chooseEditorial,
  openLookRow,
} from '@platform/testing/look/look-form-interactions';
import { saveAndExpectLook } from '@platform/testing/look/look-form-save';
import {
  setupLookForm,
  withLookTenant,
} from '@platform/testing/look/look-form-setup';
import { UPLOAD_LOGO } from '@platform/testing/site-config/fixtures';
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
      setupLookForm(withLookTenant({ plan: TENANT_PLAN.FREE }));
    });

    it('keeps a locked option focusable at its value and ignores a click', async () => {
      await openLookRow(user, LOOK_ROW.SHAPE);
      const radiusGroup = screen.getByRole('group', {
        name: `${LOOK_FORM.radiusScaleLabel} ${GROWTH_BADGE_TEXT}`,
      });
      const extraLargeButton = within(radiusGroup).getByRole('button', {
        name: EXTRA_LARGE,
      });

      await user.click(extraLargeButton);

      expect(radiusGroup).toHaveAccessibleDescription(GROWTH_BADGE_TEXT);
      expect(extraLargeButton).toBeEnabled();
      expect(extraLargeButton).toHaveAttribute(ARIA_DISABLED, 'true');
      expect(extraLargeButton).toHaveAttribute(ARIA_PRESSED, 'false');
    });

    it('keeps the locked Card style tiles at the preset value while arrows move focus', async () => {
      await openLookRow(user, LOOK_ROW.CARDS);
      const tiles = screen.getByRole('radiogroup', {
        name: `${LOOK_FORM.cardStyleLabel} ${GROWTH_BADGE_TEXT}`,
      });
      const accentBarTile = within(tiles).getByRole('radio', {
        name: LOOK_FORM.cardStyleOptionLabel.ACCENT_BAR,
      });
      const outlinedTile = within(tiles).getByRole('radio', { name: OUTLINED });

      const filledTile = within(tiles).getByRole('radio', {
        name: LOOK_FORM.cardStyleOptionLabel.FILLED,
      });

      await user.click(outlinedTile);
      await user.keyboard(USER_EVENT_KEY.ARROW_RIGHT);

      expect(filledTile).toHaveFocus();
      expect(accentBarTile).toBeChecked();
      expect(outlinedTile).toHaveAttribute(ARIA_DISABLED, 'true');
      expect(tiles).toHaveAccessibleDescription(
        `${GROWTH_BADGE_TEXT} ${LOOK_FORM.cardStyleOptionDescription.ACCENT_BAR} ${LOOK_FORM.cardStyleDescription}`,
      );
    });

    it('keeps the logo hue following the accent behind a locked switch', async () => {
      await openLookRow(user, LOOK_ROW.COLOUR);
      const followSwitch = screen.getByRole('switch', {
        name: `${FOLLOW_ACCENT_HUE} ${GROWTH_BADGE_TEXT}`,
      });
      const accentSlider = screen.getByRole('slider', { name: ACCENT_HUE });

      await user.click(followSwitch);

      const readout = screen.getByText(messages.logoHueField.followsAccent);
      const logoSlider = screen.queryByRole('slider', {
        name: messages.logoHueField.logoHueAriaLabel,
      });
      expect(followSwitch).toBeChecked();
      expect(followSwitch).toHaveAttribute(ARIA_DISABLED, 'true');
      expect(followSwitch).toHaveAccessibleDescription(
        `${GROWTH_BADGE_TEXT} ${LOOK_FORM.logoHueDescription}`,
      );
      expect(readout).toBeVisible();
      expect(logoSlider).not.toBeInTheDocument();
      expect(accentSlider).toBeEnabled();
    });

    it('saves the cookie settings button, the one footer field Free keeps', async () => {
      await openLookRow(user, LOOK_ROW.FOOTER);
      const cookieButtonGroup = screen.getByRole('group', {
        name: LOOK_FORM.cookieSettingsButtonLabel,
      });
      const shownButton = within(cookieButtonGroup).getByRole('button', {
        name: LOOK_FORM.cookieSettingsButtonOptionLabel.SHOWN,
      });
      await user.click(shownButton);

      await saveAndExpectLook(user, {
        cookieSettingsButton: COOKIE_SETTINGS_BUTTON.SHOWN,
      });
    });

    it('keeps the preset, accent hue, brand name and brand images editable', async () => {
      const editorialPreset = screen.getByRole('radio', { name: EDITORIAL });
      await openLookRow(user, LOOK_ROW.COLOUR);
      const hueSlider = screen.getByRole('slider', { name: ACCENT_HUE });
      await openLookRow(user, LOOK_ROW.BRAND);
      const brandNameInput = screen.getByRole('textbox', {
        name: LOOK_FORM.brandNameLabel,
      });
      const uploadLogoButton = screen.getByRole('button', {
        name: UPLOAD_LOGO,
      });

      expect(editorialPreset).not.toHaveAttribute(ARIA_DISABLED, 'true');
      expect(hueSlider).toBeEnabled();
      expect(brandNameInput).toBeEnabled();
      expect(uploadLogoButton).toBeEnabled();
    });

    it("previews a new preset's own fonts and corners", async () => {
      await chooseEditorial(user);
      await openLookRow(user, LOOK_ROW.SHAPE);

      const smallButton = screen.getByRole('button', {
        name: LOOK_FORM.radiusScaleOptionLabel.SM,
      });
      const sampleTokens = screen.getByTestId(LOOK_SAMPLE_TOKENS_TEST_ID);
      expect(smallButton).toHaveAttribute(ARIA_PRESSED, 'true');
      expect(sampleTokens).toHaveStyle({ '--radius-md': '4px' });
    });
  });
});
