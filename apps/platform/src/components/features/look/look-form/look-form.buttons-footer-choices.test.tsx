import {
  BRAND_VARIANT,
  BUSY_BUTTON_STYLE,
  COOKIE_SETTINGS_BUTTON,
  FOOTER_LAYOUT,
  FOOTER_SURFACE,
  LANGUAGE_SWITCHER_STYLE,
  SPINNER_STYLE,
} from '@blog/config';
import { LOOK_ROW } from '@platform/constants/look-row';
import messages from '@platform/i18n/messages/en.json';
import { screen, within } from '@platform/testing/custom-render';
import {
  FOOTER_LAYOUT_LABEL,
  SPINNER_LABEL,
} from '@platform/testing/look/look-form-fixtures';
import {
  chooseOption,
  chooseSegment,
  openLookRow,
} from '@platform/testing/look/look-form-interactions';
import { saveAndExpectLook } from '@platform/testing/look/look-form-save';
import { setupLookForm } from '@platform/testing/look/look-form-setup';
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

  describe('with the default values', () => {
    beforeEach(() => {
      setupLookForm();
    });

    it.each([
      {
        row: LOOK_ROW.BUTTONS,
        group: LOOK_FORM.busyButtonStyleLabel,
        option: LOOK_FORM.busyButtonStyleOptionLabel.EDGE,
        saved: { busyButtonStyle: BUSY_BUTTON_STYLE.EDGE },
      },
      {
        row: LOOK_ROW.FOOTER,
        group: FOOTER_LAYOUT_LABEL,
        option: LOOK_FORM.footerLayoutOptionLabel.BIG_WORDMARK,
        saved: { footerLayout: FOOTER_LAYOUT.BIG_WORDMARK },
      },
      {
        row: LOOK_ROW.FOOTER,
        group: LOOK_FORM.footerBackgroundLabel,
        option: LOOK_FORM.footerBackgroundOptionLabel.SECONDARY,
        saved: { footerBackground: BRAND_VARIANT.SECONDARY },
      },
      {
        row: LOOK_ROW.FOOTER,
        group: LOOK_FORM.footerSurfaceLabel,
        option: LOOK_FORM.footerSurfaceOptionLabel.CARD,
        saved: { footerSurface: FOOTER_SURFACE.CARD },
      },
      {
        row: LOOK_ROW.FOOTER,
        group: LOOK_FORM.cookieSettingsButtonLabel,
        option: LOOK_FORM.cookieSettingsButtonOptionLabel.SHOWN,
        saved: { cookieSettingsButton: COOKIE_SETTINGS_BUTTON.SHOWN },
      },
      {
        row: LOOK_ROW.LANGUAGE_SWITCHER,
        group: LOOK_FORM.languageSwitcherStyleLabel,
        option: LOOK_FORM.languageSwitcherOptionLabel.CODES,
        saved: { languageSwitcherStyle: LANGUAGE_SWITCHER_STYLE.CODES },
      },
    ])(
      'saves the chosen $group style',
      async ({ row, group, option, saved }) => {
        await openLookRow(user, row);
        const [styleGroup] = screen.getAllByRole('group', { name: group });
        const optionButton = within(styleGroup!).getByRole('button', {
          name: option,
        });
        await user.click(optionButton);

        await saveAndExpectLook(user, saved);
      },
    );

    it('marks a changed field as unsaved beside its label until it is changed back', async () => {
      await openLookRow(user, LOOK_ROW.FOOTER);
      await chooseSegment(
        user,
        LOOK_FORM.footerSurfaceLabel,
        LOOK_FORM.footerSurfaceOptionLabel.CARD,
      );
      const unsavedDot = screen.getByRole('img', {
        name: LOOK_FORM.fieldUnsavedLabel,
      });
      expect(unsavedDot).toBeVisible();

      await chooseSegment(
        user,
        `${LOOK_FORM.footerSurfaceLabel} ${LOOK_FORM.fieldUnsavedLabel}`,
        LOOK_FORM.footerSurfaceOptionLabel.FULL_WIDTH,
      );
      const clearedDot = screen.queryByRole('img', {
        name: LOOK_FORM.fieldUnsavedLabel,
      });
      expect(clearedDot).not.toBeInTheDocument();
    });

    it.each([
      {
        row: LOOK_ROW.BUTTONS,
        select: SPINNER_LABEL,
        option: LOOK_FORM.spinnerStyleOptionLabel.DOTS,
        saved: { spinnerStyle: SPINNER_STYLE.DOTS },
      },
    ])('saves the chosen $select', async ({ row, select, option, saved }) => {
      await openLookRow(user, row);
      await chooseOption(user, select, option);

      await saveAndExpectLook(user, saved);
    });
  });
});
