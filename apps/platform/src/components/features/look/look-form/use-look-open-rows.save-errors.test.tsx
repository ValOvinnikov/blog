import { ACTION_OUTCOME, isAccentHueAccessible } from '@blog/config';
import type * as BlogConfig from '@blog/config';
import { faker } from '@faker-js/faker';
import { LOOK_ROW } from '@platform/constants/look-row';
import { uploadBrandAssetAction } from '@platform/server/site-config/upload-brand-asset-action';
import { ARIA_EXPANDED } from '@platform/testing/aria';
import { screen, waitFor } from '@platform/testing/custom-render';
import {
  ACCENT_HUE,
  NUDGED_ACCENT_HUE,
} from '@platform/testing/look/look-form-fixtures';
import {
  clickGoToTheFirstOne,
  clickSave,
  lookRowTrigger,
  nudgeAccentHue,
  openLookRow,
  pickLogo,
} from '@platform/testing/look/look-form-interactions';
import { setupLookForm } from '@platform/testing/look/look-form-setup';
import { GO_TO_THE_FIRST_ONE } from '@platform/testing/render-in-settings-form';
import {
  MOCK_STAGED_LOGO_BLOB_URL,
  REPLACE_LOGO,
} from '@platform/testing/site-config/fixtures';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { useLookOpenRows } from './use-look-open-rows';

vi.mock('@blog/config', async (importOriginal) => ({
  ...(await importOriginal<typeof BlogConfig>()),
  isAccentHueAccessible: vi.fn(() => true),
}));

vi.mock('@platform/server/site-config/update-look-action');

vi.mock('@platform/server/site-config/upload-brand-asset-action');

vi.mock('@platform/server/site-config/clear-brand-asset-action');

faker.seed(6391);

const saveAndGoToTheFirstOne = async (user: UserEvent) => {
  await clickSave(user);
  await screen.findByRole('link', { name: GO_TO_THE_FIRST_ONE });
  await clickGoToTheFirstOne(user);
};

describe(useLookOpenRows, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    vi.mocked(isAccentHueAccessible).mockReset();
    vi.mocked(uploadBrandAssetAction).mockReset();
    vi.spyOn(URL, 'createObjectURL').mockReturnValue(MOCK_STAGED_LOGO_BLOB_URL);
    setupLookForm();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('when the accent hue is rejected', () => {
    beforeEach(async () => {
      vi.mocked(isAccentHueAccessible).mockImplementation(
        (hue) => hue !== NUDGED_ACCENT_HUE,
      );
      await nudgeAccentHue(user);
      const colourTrigger = lookRowTrigger(LOOK_ROW.COLOUR);
      await user.click(colourTrigger);
      await openLookRow(user, LOOK_ROW.FOOTER);
    });

    it('opens the Colour row, keeps Footer open and focuses the slider', async () => {
      await saveAndGoToTheFirstOne(user);

      const colourTrigger = lookRowTrigger(LOOK_ROW.COLOUR);
      const footerTrigger = lookRowTrigger(LOOK_ROW.FOOTER);
      const slider = screen.getByRole('slider', { name: ACCENT_HUE });
      expect(colourTrigger).toHaveAttribute(ARIA_EXPANDED, 'true');
      expect(footerTrigger).toHaveAttribute(ARIA_EXPANDED, 'true');
      expect(slider).toHaveFocus();
    });
  });

  describe('when the logo upload fails', () => {
    beforeEach(async () => {
      vi.mocked(uploadBrandAssetAction).mockResolvedValue({
        outcome: ACTION_OUTCOME.SERVER_ERROR,
      });
      await pickLogo(user);
      const brandTrigger = lookRowTrigger(LOOK_ROW.BRAND);
      await user.click(brandTrigger);
      await openLookRow(user, LOOK_ROW.COLOUR);
    });

    it('opens the Brand row, folds nothing else and focuses the picker', async () => {
      await saveAndGoToTheFirstOne(user);

      const brandTrigger = lookRowTrigger(LOOK_ROW.BRAND);
      const colourTrigger = lookRowTrigger(LOOK_ROW.COLOUR);
      const replaceLogoButton = screen.getByRole('button', {
        name: REPLACE_LOGO,
      });
      await waitFor(() => {
        expect(replaceLogoButton).toHaveFocus();
      });
      expect(brandTrigger).toHaveAttribute(ARIA_EXPANDED, 'true');
      expect(colourTrigger).toHaveAttribute(ARIA_EXPANDED, 'true');
    });
  });
});
