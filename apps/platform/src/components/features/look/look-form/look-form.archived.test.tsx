import { LOOK_ROW } from '@platform/constants/look-row';
import messages from '@platform/i18n/messages/en.json';
import { ARIA_DISABLED } from '@platform/testing/aria';
import { expectArchivedOffersNoSave } from '@platform/testing/assert-archived-save';
import { screen, within } from '@platform/testing/custom-render';
import {
  ACCENT_HUE,
  COMPACT,
  CONSOLE,
  DATA_DISABLED,
  EDITORIAL,
  EXTRA_LARGE,
  FOLLOW_ACCENT_HUE,
  HEADER_LAYOUT_LABEL,
  MOCK_SAVED_ACCENT_HUE,
  OUTLINED,
  RESET_TO_PRESET,
  UPLOAD_FAVICON,
} from '@platform/testing/look/look-form-fixtures';
import { openLookRow } from '@platform/testing/look/look-form-interactions';
import { setupArchived } from '@platform/testing/look/look-form-setup';
import { ARCHIVED_NOTICE_DESCRIPTION } from '@platform/testing/render-in-settings-form';
import { UPLOAD_LOGO } from '@platform/testing/site-config/fixtures';
import { defaultLookFormValues } from '@platform/utils/default-look-values/default-look-values';
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

  describe('archived tenant', () => {
    describe('with only the archive date', () => {
      beforeEach(() => {
        setupArchived();
      });

      it('shows an archived notice and offers no Save', () => {
        expectArchivedOffersNoSave();
      });

      it('disables every Look control', async () => {
        const consolePreset = screen.getByRole('radio', { name: CONSOLE });
        const editorialPreset = screen.getByRole('radio', { name: EDITORIAL });
        await openLookRow(user, LOOK_ROW.COLOUR);
        const hueSlider = screen.getByRole('slider', { name: ACCENT_HUE });
        const followSwitch = screen.getByRole('switch', {
          name: FOLLOW_ACCENT_HUE,
        });
        await openLookRow(user, LOOK_ROW.BRAND);
        const uploadLogoButton = screen.getByRole('button', {
          name: UPLOAD_LOGO,
        });
        const uploadFaviconButton = screen.getByRole('button', {
          name: UPLOAD_FAVICON,
        });

        expect(consolePreset).toHaveAttribute(ARIA_DISABLED, 'true');
        expect(editorialPreset).toHaveAttribute(ARIA_DISABLED, 'true');
        expect(hueSlider).toBeDisabled();
        expect(followSwitch).toBeDisabled();
        expect(uploadLogoButton).toBeDisabled();
        expect(uploadFaviconButton).toBeDisabled();
      });

      it('disables the Header controls', async () => {
        await openLookRow(user, LOOK_ROW.HEADER);
        const layoutSelect = screen.getByRole('combobox', {
          name: HEADER_LAYOUT_LABEL,
        });
        const dropdownButton = screen.getByRole('button', {
          name: LOOK_FORM.headerSubmenuStyleOptionLabel.DROPDOWN,
        });
        const floatingButton = screen.getByRole('button', {
          name: LOOK_FORM.headerBarStyleOptionLabel.FLOATING,
        });

        expect(layoutSelect).toHaveAttribute(DATA_DISABLED);
        expect(layoutSelect).toHaveAccessibleDescription(
          `${ARCHIVED_NOTICE_DESCRIPTION} ${LOOK_FORM.headerLayoutDescription}`,
        );
        expect(dropdownButton).toBeDisabled();
        expect(floatingButton).toBeDisabled();
      });

      it('disables the Type and Shape controls', async () => {
        await openLookRow(user, LOOK_ROW.TYPE);
        const headingFont = screen.getByRole('combobox', {
          name: LOOK_FORM.headingFontLabel,
        });
        const bodyFont = screen.getByRole('combobox', {
          name: LOOK_FORM.bodyFontLabel,
        });
        await openLookRow(user, LOOK_ROW.SHAPE);
        const smallButton = screen.getByRole('button', {
          name: LOOK_FORM.radiusScaleOptionLabel.SM,
        });
        const extraLargeButton = screen.getByRole('button', {
          name: EXTRA_LARGE,
        });
        const compactButton = screen.getByRole('button', { name: COMPACT });
        const cardStyleGroup = screen.getByRole('group', {
          name: LOOK_FORM.cardStyleLabel,
        });
        const outlinedCardButton = within(cardStyleGroup).getByRole('button', {
          name: OUTLINED,
        });
        const softButton = screen.getByRole('button', {
          name: LOOK_FORM.headerControlStyleOptionLabel.SOFT,
        });

        expect(headingFont).toHaveAttribute(DATA_DISABLED);
        expect(bodyFont).toHaveAccessibleDescription(
          ARCHIVED_NOTICE_DESCRIPTION,
        );
        expect(smallButton).toBeDisabled();
        expect(extraLargeButton).toBeDisabled();
        expect(compactButton).toBeDisabled();
        expect(outlinedCardButton).toBeDisabled();
        expect(softButton).toBeDisabled();
      });
    });

    it('disables Reset to preset and describes it with the archived notice', () => {
      setupArchived({
        initialValues: {
          ...defaultLookFormValues(),
          accentHue: MOCK_SAVED_ACCENT_HUE,
        },
      });

      const resetButton = screen.getByRole('button', { name: RESET_TO_PRESET });

      expect(resetButton).toBeDisabled();
      expect(resetButton).toHaveAccessibleDescription(
        ARCHIVED_NOTICE_DESCRIPTION,
      );
    });
  });
});
