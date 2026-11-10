import { HEADER_CONTROL_STYLE, RADIUS_SCALE } from '@blog/config';
import { LOOK_ROW } from '@platform/constants/look-row';
import { LOOK_SAMPLE_TOKENS_TEST_ID } from '@platform/constants/look-sample';
import messages from '@platform/i18n/messages/en.json';
import { updateLookAction } from '@platform/server/site-config/update-look-action';
import { ARIA_PRESSED } from '@platform/testing/aria';
import { screen, within } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import {
  COMPACT,
  CONSOLE,
  EDITORIAL,
  EDITORIAL_ACCENT_HUE,
  EXTRA_LARGE,
  hueValue,
  RESET_TO_PRESET,
} from '@platform/testing/look/look-form-fixtures';
import {
  chooseEditorial,
  openLookRow,
} from '@platform/testing/look/look-form-interactions';
import { setupLookForm } from '@platform/testing/look/look-form-setup';
import { defaultLookFormValues } from '@platform/utils/default-look-values/default-look-values';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { LookForm } from './look-form';

vi.mock('@platform/server/site-config/update-look-action');

vi.mock('@platform/server/site-config/upload-brand-asset-action');

vi.mock('@platform/server/site-config/clear-brand-asset-action');

const { lookForm: LOOK_FORM } = messages;

const USE_PRESET_RADIUS = makeEnTranslator('lookForm')(
  'usePresetValueAriaLabel',
  { field: LOOK_FORM.radiusScaleLabel },
);

describe(`<${LookForm.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  describe('with the default values', () => {
    beforeEach(() => {
      setupLookForm();
    });

    it('selects a preset with the arrow keys and applies it to the form', async () => {
      const consolePreset = screen.getByRole('radio', { name: CONSOLE });
      const editorialPreset = screen.getByRole('radio', { name: EDITORIAL });
      await user.click(consolePreset);
      await user.keyboard('{ArrowRight}');
      await openLookRow(user, LOOK_ROW.COLOUR);

      const hueReadout = screen.getByText(hueValue(EDITORIAL_ACCENT_HUE));
      expect(editorialPreset).toBeChecked();
      expect(hueReadout).toBeVisible();
      expect(updateLookAction).not.toHaveBeenCalled();
    });

    describe('after choosing the Editorial preset', () => {
      beforeEach(async () => {
        await chooseEditorial(user);
        await openLookRow(user, LOOK_ROW.COLOUR);
      });

      it('marks no unsaved change on the Preset title', () => {
        const presetHeading = screen.getByRole('heading', {
          name: LOOK_FORM.presetLabel,
        });

        expect(presetHeading).toBeVisible();
      });

      it("resets the accent hue to the preset's", () => {
        const hueReadout = screen.getByText(hueValue(EDITORIAL_ACCENT_HUE));

        expect(hueReadout).toBeVisible();
      });

      it("previews the preset's card style", () => {
        const sampleTokens = screen.getByTestId(LOOK_SAMPLE_TOKENS_TEST_ID);

        expect(sampleTokens).toHaveStyle({ '--item-border-width': '1px' });
      });
    });
  });

  it('resets the header buttons style with the rest of the preset', async () => {
    setupLookForm({
      initialValues: {
        ...defaultLookFormValues(),
        headerControlStyle: HEADER_CONTROL_STYLE.PLAIN,
      },
    });

    const resetToPresetButton = screen.getByRole('button', {
      name: RESET_TO_PRESET,
    });
    await user.click(resetToPresetButton);
    await openLookRow(user, LOOK_ROW.HEADER);

    const headerButtons = screen.getByRole('group', {
      name: `${LOOK_FORM.headerControlStyleLabel} ${LOOK_FORM.fieldUnsavedLabel}`,
    });
    const outlinedButton = within(headerButtons).getByRole('button', {
      name: LOOK_FORM.headerControlStyleOptionLabel.OUTLINED,
    });
    expect(outlinedButton).toHaveAttribute(ARIA_PRESSED, 'true');
  });

  describe('after choosing a preset over a customised radius', () => {
    beforeEach(async () => {
      setupLookForm({
        initialValues: {
          ...defaultLookFormValues(),
          radiusScale: RADIUS_SCALE.XL,
        },
      });
      await chooseEditorial(user);
      await openLookRow(user, LOOK_ROW.SHAPE);
    });

    it('keeps the customised radius and takes the density the owner left alone', () => {
      const extraLargeButton = screen.getByRole('button', {
        name: EXTRA_LARGE,
      });
      const compactButton = screen.getByRole('button', { name: COMPACT });

      expect(extraLargeButton).toHaveAttribute(ARIA_PRESSED, 'true');
      expect(compactButton).toHaveAttribute(ARIA_PRESSED, 'true');
    });

    it("puts the radius alone back to the new preset's value", async () => {
      const usePresetRadiusLink = screen.getByRole('button', {
        name: USE_PRESET_RADIUS,
      });
      await user.click(usePresetRadiusLink);

      const smallButton = screen.getByRole('button', {
        name: LOOK_FORM.radiusScaleOptionLabel.SM,
      });
      const usePresetRadiusButton = screen.queryByRole('button', {
        name: USE_PRESET_RADIUS,
      });
      expect(smallButton).toHaveAttribute(ARIA_PRESSED, 'true');
      expect(usePresetRadiusButton).not.toBeInTheDocument();
    });
  });
});
