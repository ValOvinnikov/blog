import { ACTION_OUTCOME, isAccentHueAccessible } from '@blog/config';
import type * as BlogConfig from '@blog/config';
import { faker } from '@faker-js/faker';
import { LOOK_ROW } from '@platform/constants/look-row';
import messages from '@platform/i18n/messages/en.json';
import { uploadBrandAssetAction } from '@platform/server/site-config/upload-brand-asset-action';
import { ARIA_EXPANDED } from '@platform/testing/aria';
import { screen, waitFor, within } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import {
  clickGoToTheFirstOne,
  lookRowTrigger,
  nudgeAccentHue,
  openLookRow,
  pickLogo,
} from '@platform/testing/look/look-form-interactions';
import { setupLookForm } from '@platform/testing/look/look-form-setup';
import {
  GO_TO_THE_FIRST_ONE,
  SAVE_CHANGES,
} from '@platform/testing/render-in-settings-form';
import {
  MOCK_STAGED_LOGO_BLOB_URL,
  REPLACE_LOGO,
} from '@platform/testing/site-config/fixtures';
import { defaultLookFormValues } from '@platform/utils/default-look-values/default-look-values';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { useLookOpenRows } from './use-look-open-rows';

vi.mock('@blog/config', async (importOriginal) => ({
  ...(await importOriginal<typeof BlogConfig>()),
  isAccentHueAccessible: vi.fn(() => true),
}));

vi.mock('@platform/server/site-config/update-look-action', () => ({
  updateLookAction: vi.fn(),
}));

vi.mock('@platform/server/site-config/upload-brand-asset-action', () => ({
  uploadBrandAssetAction: vi.fn(),
}));

vi.mock('@platform/server/site-config/clear-brand-asset-action', () => ({
  clearBrandAssetAction: vi.fn(),
}));

faker.seed(6391);

const { lookForm: LOOK_FORM } = messages;
const tSaveBar = makeEnTranslator('saveBar');

const UNSAVED_DOT = tSaveBar('regionLabel');
const ACCENT_HUE = LOOK_FORM.accentHueLabel;
const NUDGED_ACCENT_HUE = defaultLookFormValues().accentHue + 1;
const RESET_TO_PRESET = LOOK_FORM.resetButton;

const saveAndGoToTheFirstOne = async (user: UserEvent) => {
  const saveButton = screen.getByRole('button', { name: SAVE_CHANGES });
  await user.click(saveButton);
  await screen.findByRole('link', { name: GO_TO_THE_FIRST_ONE });
  await clickGoToTheFirstOne(user);
};

describe(useLookOpenRows, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    vi.spyOn(URL, 'createObjectURL').mockReturnValue(MOCK_STAGED_LOGO_BLOB_URL);
    setupLookForm();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each(Object.values(LOOK_ROW))('loads the %s row folded', (row) => {
    const trigger = lookRowTrigger(row);

    expect(trigger).toHaveAttribute(ARIA_EXPANDED, 'false');
  });

  it('folds an open Style row when a Site parts row opens', async () => {
    await openLookRow(user, LOOK_ROW.COLOUR);
    await openLookRow(user, LOOK_ROW.HEADER);

    const colourTrigger = lookRowTrigger(LOOK_ROW.COLOUR);
    const headerTrigger = lookRowTrigger(LOOK_ROW.HEADER);
    expect(colourTrigger).toHaveAttribute(ARIA_EXPANDED, 'false');
    expect(headerTrigger).toHaveAttribute(ARIA_EXPANDED, 'true');
  });

  describe('with the Colour row open', () => {
    beforeEach(async () => {
      await openLookRow(user, LOOK_ROW.COLOUR);
    });

    it('names an open row body after the row title', () => {
      const body = screen.getByRole('group', { name: LOOK_FORM.colourHeading });
      const slider = within(body).getByRole('slider', { name: ACCENT_HUE });

      expect(slider).toBeVisible();
    });

    describe('with the accent hue nudged', () => {
      beforeEach(async () => {
        await nudgeAccentHue(user);
      });

      it('keeps a typed value when its row folds and opens again', async () => {
        const colourTrigger = lookRowTrigger(LOOK_ROW.COLOUR);
        await user.click(colourTrigger);
        await user.click(colourTrigger);

        const slider = screen.getByRole('slider', { name: ACCENT_HUE });
        expect(slider).toHaveValue(String(NUDGED_ACCENT_HUE));
      });

      it('shows the unsaved dot on the changed row only', async () => {
        const colourTrigger = lookRowTrigger(LOOK_ROW.COLOUR);
        await user.click(colourTrigger);

        const dots = screen.getAllByRole('img', { name: UNSAVED_DOT });
        const colourDot = within(colourTrigger).getByRole('img', {
          name: UNSAVED_DOT,
        });
        expect(dots).toEqual([colourDot]);
      });

      it('keeps Reset to preset on a card that is not a folding row', () => {
        const presetTrigger = screen.queryByRole('button', {
          name: LOOK_FORM.presetLabel,
        });
        const resetButton = screen.getByRole('button', {
          name: RESET_TO_PRESET,
        });

        expect(presetTrigger).not.toBeInTheDocument();
        expect(resetButton).toBeVisible();
      });
    });
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
