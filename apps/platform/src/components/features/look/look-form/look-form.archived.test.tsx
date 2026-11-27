import { ARIA_ATTRIBUTE } from '@platform/constants/aria-attribute';
import { LOOK_ROW } from '@platform/constants/look-row';
import messages from '@platform/i18n/messages/en.json';
import { expectArchivedOffersNoSave } from '@platform/testing/assert-archived-save';
import { screen, within } from '@platform/testing/custom-render';
import {
  ACCENT_HUE,
  COMPACT,
  CONSOLE,
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

      it('locks every Look control focusable, aria-disabled', async () => {
        const consolePreset = screen.getByRole('radio', { name: CONSOLE });
        const editorialPreset = screen.getByRole('radio', { name: EDITORIAL });
        await openLookRow(user, LOOK_ROW.COLOUR);
        const hueSlider = screen.getByRole('slider', { name: ACCENT_HUE });
        await openLookRow(user, LOOK_ROW.BRAND);
        const followSwitch = screen.getByRole('switch', {
          name: FOLLOW_ACCENT_HUE,
        });
        const uploadLogoButton = screen.getByRole('button', {
          name: UPLOAD_LOGO,
        });
        const uploadFaviconButton = screen.getByRole('button', {
          name: UPLOAD_FAVICON,
        });

        expect(consolePreset).toHaveAttribute(ARIA_ATTRIBUTE.DISABLED, 'true');
        expect(editorialPreset).toHaveAttribute(
          ARIA_ATTRIBUTE.DISABLED,
          'true',
        );
        expect(hueSlider).toHaveAttribute(ARIA_ATTRIBUTE.DISABLED, 'true');
        expect(followSwitch).toHaveAttribute(ARIA_ATTRIBUTE.DISABLED, 'true');
        expect(uploadLogoButton).toHaveAttribute(
          ARIA_ATTRIBUTE.DISABLED,
          'true',
        );
        expect(uploadFaviconButton).toHaveAttribute(
          ARIA_ATTRIBUTE.DISABLED,
          'true',
        );
      });

      it('locks the Header controls', async () => {
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
        const headerButtonsGroup = screen.getByRole('group', {
          name: LOOK_FORM.headerControlStyleLabel,
        });
        const softButton = within(headerButtonsGroup).getByRole('button', {
          name: LOOK_FORM.headerControlStyleOptionLabel.SOFT,
        });
        const underlineButton = screen.getByRole('button', {
          name: LOOK_FORM.navLinkStyleOptionLabel.UNDERLINE,
        });

        expect(layoutSelect).toHaveAttribute(ARIA_ATTRIBUTE.DISABLED, 'true');
        expect(layoutSelect).toHaveAccessibleDescription(
          `${ARCHIVED_NOTICE_DESCRIPTION} ${LOOK_FORM.headerLayoutDescription}`,
        );
        expect(dropdownButton).toHaveAttribute(ARIA_ATTRIBUTE.DISABLED, 'true');
        expect(floatingButton).toHaveAttribute(ARIA_ATTRIBUTE.DISABLED, 'true');
        expect(softButton).toHaveAttribute(ARIA_ATTRIBUTE.DISABLED, 'true');
        expect(underlineButton).toHaveAttribute(
          ARIA_ATTRIBUTE.DISABLED,
          'true',
        );
      });

      it('locks the Type, Corners & spacing and Cards controls', async () => {
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
        const outlinedCardTile = within(cardStyleGroup).getByRole('radio', {
          name: OUTLINED,
        });

        expect(headingFont).toHaveAttribute(ARIA_ATTRIBUTE.DISABLED, 'true');
        expect(bodyFont).toHaveAccessibleDescription(
          ARCHIVED_NOTICE_DESCRIPTION,
        );
        expect(smallButton).toHaveAttribute(ARIA_ATTRIBUTE.DISABLED, 'true');
        expect(extraLargeButton).toHaveAttribute(
          ARIA_ATTRIBUTE.DISABLED,
          'true',
        );
        expect(compactButton).toHaveAttribute(ARIA_ATTRIBUTE.DISABLED, 'true');
        expect(outlinedCardTile).toHaveAttribute(
          ARIA_ATTRIBUTE.DISABLED,
          'true',
        );
      });
    });

    it('locks Reset to preset and describes it with the archived notice', () => {
      setupArchived({
        initialValues: {
          ...defaultLookFormValues(),
          accentHue: MOCK_SAVED_ACCENT_HUE,
        },
      });

      const resetButton = screen.getByRole('button', { name: RESET_TO_PRESET });

      expect(resetButton).toHaveAttribute(ARIA_ATTRIBUTE.DISABLED, 'true');
      expect(resetButton).toHaveAccessibleDescription(
        ARCHIVED_NOTICE_DESCRIPTION,
      );
    });
  });
});
