import { TENANT_PLAN } from '@blog/db/constants';
import { LOOK_ROW_TITLE_KEY } from '@platform/components/features/look/look-form/look-row-title-key';
import { FONT_OPTIONS } from '@platform/config/fonts';
import { LOOK_ROW } from '@platform/constants/look-row';
import messages from '@platform/i18n/messages/en.json';
import { ARIA_DISABLED, ARIA_PRESSED } from '@platform/testing/aria';
import { screen, within } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import {
  ACCENT_HUE,
  CONSOLE,
  EXTRA_LARGE,
  FOLLOW_ACCENT_HUE,
  GROWTH_BADGE_TEXT,
} from '@platform/testing/look/look-form-fixtures';
import { openLookRow } from '@platform/testing/look/look-form-interactions';
import { setupLookForm } from '@platform/testing/look/look-form-setup';
import { defaultLookFormValues } from '@platform/utils/default-look-values/default-look-values';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { LookForm } from './look-form';

vi.mock('@platform/server/site-config/update-look-action');

vi.mock('@platform/server/site-config/upload-brand-asset-action');

vi.mock('@platform/server/site-config/clear-brand-asset-action');

const { lookForm: LOOK_FORM } = messages;
const tLookForm = makeEnTranslator('lookForm');

const GROWTH_FIELDS_LINE = tLookForm('lockLineGrowthFields', {
  preset: CONSOLE,
});
const HEADING_FONT = FONT_OPTIONS[defaultLookFormValues().headingFont].label;

describe(`<${LookForm.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  describe('on Free', () => {
    beforeEach(() => {
      setupLookForm({ plan: TENANT_PLAN.FREE });
    });

    it.each([
      LOOK_ROW.COLOUR,
      LOOK_ROW.SHAPE,
      LOOK_ROW.BUTTONS,
      LOOK_ROW.HEADER,
      LOOK_ROW.FOOTER,
    ])('says what the Growth fields of an open %s row keep', async (row) => {
      await openLookRow(user, row);

      const openCard = screen.getByRole('group', {
        name: LOOK_FORM[LOOK_ROW_TITLE_KEY[row]],
      });
      const lockLine = within(openCard).getByText(GROWTH_FIELDS_LINE);

      expect(lockLine).toBeVisible();
    });

    it('says Type keeps the preset fonts and shows them locked', async () => {
      await openLookRow(user, LOOK_ROW.TYPE);

      const typeCard = screen.getByRole('group', {
        name: LOOK_FORM.typeHeading,
      });
      const lockLine = within(typeCard).getByText(
        tLookForm('lockLineTypeFonts', { preset: CONSOLE }),
      );
      const headingFont = screen.getByRole('combobox', {
        name: `${LOOK_FORM.headingFontLabel} ${GROWTH_BADGE_TEXT} ${HEADING_FONT}`,
      });

      expect(lockLine).toBeVisible();
      expect(headingFont).toHaveAttribute(ARIA_DISABLED, 'true');
      expect(headingFont).toHaveAccessibleDescription(GROWTH_BADGE_TEXT);
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
  });
});
