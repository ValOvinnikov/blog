import { COOKIE_SETTINGS_BUTTON } from '@blog/config';
import { TENANT_PLAN } from '@blog/db/constants';
import { LOOK_ROW } from '@platform/constants/look-row';
import { LOOK_SAMPLE_TOKENS_TEST_ID } from '@platform/constants/look-sample';
import messages from '@platform/i18n/messages/en.json';
import { ARIA_DISABLED, ARIA_PRESSED } from '@platform/testing/aria';
import { screen, within } from '@platform/testing/custom-render';
import {
  ACCENT_HUE,
  EDITORIAL,
} from '@platform/testing/look/look-form-fixtures';
import {
  chooseEditorial,
  openLookRow,
} from '@platform/testing/look/look-form-interactions';
import { saveAndExpectLook } from '@platform/testing/look/look-form-save';
import { setupLookForm } from '@platform/testing/look/look-form-setup';
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
      setupLookForm({ plan: TENANT_PLAN.FREE });
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

    it('keeps the preset, accent hue and brand images editable', async () => {
      const editorialPreset = screen.getByRole('radio', { name: EDITORIAL });
      await openLookRow(user, LOOK_ROW.COLOUR);
      const hueSlider = screen.getByRole('slider', { name: ACCENT_HUE });
      await openLookRow(user, LOOK_ROW.BRAND);
      const uploadLogoButton = screen.getByRole('button', {
        name: UPLOAD_LOGO,
      });

      expect(editorialPreset).not.toHaveAttribute(ARIA_DISABLED, 'true');
      expect(hueSlider).toBeEnabled();
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
