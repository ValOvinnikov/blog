import { COOKIE_SETTINGS_BUTTON } from '@blog/config';
import { TENANT_PLAN } from '@blog/db/constants';
import { LOOK_ROW_TITLE_KEY } from '@platform/components/features/look/look-form/look-row-title-key';
import { FONT_OPTIONS } from '@platform/config/fonts';
import { LOOK_ROW, type TLookRow } from '@platform/constants/look-row';
import { LOOK_SAMPLE_TOKENS_TEST_ID } from '@platform/constants/look-sample';
import messages from '@platform/i18n/messages/en.json';
import { ARIA_DISABLED, ARIA_PRESSED } from '@platform/testing/aria';
import { screen, within } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import {
  ACCENT_HUE,
  CONSOLE,
  EDITORIAL,
  EXTRA_LARGE,
  FOLLOW_ACCENT_HUE,
  GROWTH,
  GROWTH_BADGE_TEXT,
  MOCK_SAVED_ACCENT_HUE,
  RESET_TO_PRESET,
} from '@platform/testing/look/look-form-fixtures';
import {
  chooseEditorial,
  lookRowTrigger,
  openLookRow,
} from '@platform/testing/look/look-form-interactions';
import { saveAndExpectLook } from '@platform/testing/look/look-form-save';
import {
  setupArchived,
  setupLookForm,
} from '@platform/testing/look/look-form-setup';
import { UPLOAD_LOGO } from '@platform/testing/site-config/fixtures';
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

const growthRowBadge = (row: TLookRow) =>
  within(lookRowTrigger(row)).queryByText(GROWTH, { exact: true });

describe(`<${LookForm.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  it('offers no Reset to preset on Free, even with an accent hue off the preset', () => {
    setupLookForm({
      plan: TENANT_PLAN.FREE,
      initialValues: {
        ...defaultLookFormValues(),
        accentHue: MOCK_SAVED_ACCENT_HUE,
      },
    });

    const resetButton = screen.queryByRole('button', {
      name: RESET_TO_PRESET,
    });
    const editorialPreset = screen.getByRole('radio', { name: EDITORIAL });
    expect(resetButton).not.toBeInTheDocument();
    expect(editorialPreset).not.toHaveAttribute(ARIA_DISABLED, 'true');
  });

  it.each([
    { site: 'a Growth site', setup: () => setupLookForm() },
    {
      site: 'an archived Free site',
      setup: () => setupArchived({ plan: TENANT_PLAN.FREE }),
    },
  ])('shows no Growth badge on $site', ({ setup }) => {
    setup();

    const badges = screen.queryAllByText(GROWTH, { exact: true });

    expect(badges).toHaveLength(0);
  });

  describe('on Free', () => {
    beforeEach(() => {
      setupLookForm({ plan: TENANT_PLAN.FREE });
    });

    it.each([
      LOOK_ROW.TYPE,
      LOOK_ROW.SHAPE,
      LOOK_ROW.BUTTONS,
      LOOK_ROW.HEADER,
      LOOK_ROW.LANGUAGE_SWITCHER,
    ])('badges the folded %s row, every field of which is Growth', (row) => {
      expect(growthRowBadge(row)).toBeVisible();
    });

    it.each([LOOK_ROW.COLOUR, LOOK_ROW.BRAND, LOOK_ROW.FOOTER])(
      'leaves the folded %s row unbadged, as it keeps a live field',
      (row) => {
        expect(growthRowBadge(row)).not.toBeInTheDocument();
      },
    );

    it('drops the row badge once the row opens, leaving the field badges', async () => {
      await openLookRow(user, LOOK_ROW.TYPE);

      const typeCard = screen.getByRole('group', {
        name: LOOK_FORM.typeHeading,
      });
      const fieldBadges = within(typeCard).getAllByText(GROWTH, {
        exact: true,
      });

      expect(growthRowBadge(LOOK_ROW.TYPE)).not.toBeInTheDocument();
      expect(fieldBadges).toHaveLength(2);
    });

    it('never shows the old Growth plan lock wording', () => {
      const oldLock = screen.queryByText(
        messages.featuresSettings.planLockedBadge,
      );

      expect(oldLock).not.toBeInTheDocument();
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
