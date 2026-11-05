import { LOOK_ROW } from '@platform/constants/look-row';
import { updateLookAction } from '@platform/server/site-config/update-look-action';
import { screen } from '@platform/testing/custom-render';
import {
  COMPACT,
  DEFAULT_ACCENT_HUE,
  DISCARD,
  hueValue,
  MOCK_SAVED_ACCENT_HUE,
  RESET_TO_PRESET,
} from '@platform/testing/look/look-form-fixtures';
import { openLookRow } from '@platform/testing/look/look-form-interactions';
import { setupLookForm } from '@platform/testing/look/look-form-setup';
import { UNSAVED_CHANGES } from '@platform/testing/render-in-settings-form';
import { defaultLookFormValues } from '@platform/utils/default-look-values/default-look-values';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { LookForm } from './look-form';

vi.mock('@platform/server/site-config/update-look-action');

vi.mock('@platform/server/site-config/upload-brand-asset-action');

vi.mock('@platform/server/site-config/clear-brand-asset-action');

describe(`<${LookForm.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  describe('with a saved accent hue off the preset', () => {
    beforeEach(() => {
      setupLookForm({
        initialValues: {
          ...defaultLookFormValues(),
          accentHue: MOCK_SAVED_ACCENT_HUE,
        },
      });
    });

    it('offers Reset to preset with no unsaved edits, hiding it once matched', async () => {
      const unsavedRegion = screen.queryByRole('region', {
        name: UNSAVED_CHANGES,
      });
      expect(unsavedRegion).not.toBeInTheDocument();

      const resetToPresetButton = screen.getByRole('button', {
        name: RESET_TO_PRESET,
      });
      await user.click(resetToPresetButton);
      await openLookRow(user, LOOK_ROW.COLOUR);

      const hueReadout = screen.getByText(hueValue(DEFAULT_ACCENT_HUE));
      const resetButton = screen.queryByRole('button', {
        name: RESET_TO_PRESET,
      });
      expect(hueReadout).toBeVisible();
      expect(resetButton).not.toBeInTheDocument();
    });

    it('resets to the preset in the draft only, so Discard restores the saved look', async () => {
      await openLookRow(user, LOOK_ROW.SHAPE);
      const compactButton = screen.getByRole('button', { name: COMPACT });
      await user.click(compactButton);
      const resetToPresetButton = screen.getByRole('button', {
        name: RESET_TO_PRESET,
      });
      await user.click(resetToPresetButton);
      await openLookRow(user, LOOK_ROW.COLOUR);

      const resetReadout = screen.getByText(hueValue(DEFAULT_ACCENT_HUE));
      expect(resetReadout).toBeVisible();
      expect(updateLookAction).not.toHaveBeenCalled();

      const discardButton = screen.getByRole('button', { name: DISCARD });
      await user.click(discardButton);

      const savedReadout = screen.getByText(hueValue(MOCK_SAVED_ACCENT_HUE));
      expect(savedReadout).toBeVisible();
    });
  });
});
