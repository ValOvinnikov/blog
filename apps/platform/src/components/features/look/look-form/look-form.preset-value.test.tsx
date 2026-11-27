import { ARIA_ATTRIBUTE } from '@platform/constants/aria-attribute';
import { LOOK_ROW } from '@platform/constants/look-row';
import messages from '@platform/i18n/messages/en.json';
import { screen, within } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import {
  COMPACT,
  EXTRA_LARGE,
} from '@platform/testing/look/look-form-fixtures';
import {
  chooseEditorial,
  chooseSegment,
  openLookRow,
} from '@platform/testing/look/look-form-interactions';
import { setupLookForm } from '@platform/testing/look/look-form-setup';
import { defaultLookFormValues } from '@platform/utils/default-look-values/default-look-values';
import { RADIUS_SCALE } from '@shinefold/config';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { LookForm } from './look-form';

vi.mock('@platform/server/site-config/update-look-action');

vi.mock('@platform/server/site-config/upload-brand-asset-action');

vi.mock('@platform/server/site-config/clear-brand-asset-action');

const { lookForm: LOOK_FORM } = messages;

const usePresetValueName = (field: string) =>
  makeEnTranslator('lookForm')('usePresetValueAriaLabel', { field });

describe(`<${LookForm.name}/> Use preset value`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  it.each([
    {
      row: LOOK_ROW.SHAPE,
      label: LOOK_FORM.buttonShapeLabel,
      chosen: LOOK_FORM.buttonShapeOptionLabel.SQUARE,
      preset: LOOK_FORM.buttonShapeOptionLabel.ROUNDED,
    },
    {
      row: LOOK_ROW.HEADER,
      label: LOOK_FORM.navLinkStyleLabel,
      chosen: LOOK_FORM.navLinkStyleOptionLabel.PILL,
      preset: LOOK_FORM.navLinkStyleOptionLabel.PLAIN,
    },
    {
      row: LOOK_ROW.HEADER,
      label: LOOK_FORM.headerControlShapeLabel,
      chosen: LOOK_FORM.headerControlShapeOptionLabel.ROUNDED,
      preset: LOOK_FORM.headerControlShapeOptionLabel.ROUND,
    },
    {
      row: LOOK_ROW.HEADER,
      label: LOOK_FORM.headerActionStyleLabel,
      chosen: LOOK_FORM.headerActionStyleOptionLabel.OUTLINED,
      preset: LOOK_FORM.headerActionStyleOptionLabel.FILLED,
    },
    {
      row: LOOK_ROW.HEADER,
      label: LOOK_FORM.headerActionPhonePlacementLabel,
      chosen: LOOK_FORM.headerActionPhonePlacementOptionLabel.BAR,
      preset: LOOK_FORM.headerActionPhonePlacementOptionLabel.MENU,
    },
  ])(
    'puts $label back to the preset value',
    async ({ row, label, chosen, preset }) => {
      setupLookForm();
      await openLookRow(user, row);
      await chooseSegment(user, label, chosen);
      const usePresetButton = screen.getByRole('button', {
        name: usePresetValueName(label),
      });

      await user.click(usePresetButton);

      const group = screen.getByRole('group', { name: label });
      const presetButton = within(group).getByRole('button', { name: preset });
      expect(presetButton).toHaveAttribute(ARIA_ATTRIBUTE.PRESSED, 'true');
    },
  );

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

      expect(extraLargeButton).toHaveAttribute(ARIA_ATTRIBUTE.PRESSED, 'true');
      expect(compactButton).toHaveAttribute(ARIA_ATTRIBUTE.PRESSED, 'true');
    });

    it("puts the radius alone back to the new preset's value", async () => {
      const usePresetRadiusLink = screen.getByRole('button', {
        name: usePresetValueName(LOOK_FORM.radiusScaleLabel),
      });
      await user.click(usePresetRadiusLink);

      const smallButton = screen.getByRole('button', {
        name: LOOK_FORM.radiusScaleOptionLabel.SM,
      });
      const usePresetRadiusButton = screen.queryByRole('button', {
        name: usePresetValueName(LOOK_FORM.radiusScaleLabel),
      });
      expect(smallButton).toHaveAttribute(ARIA_ATTRIBUTE.PRESSED, 'true');
      expect(usePresetRadiusButton).not.toBeInTheDocument();
    });
  });
});
