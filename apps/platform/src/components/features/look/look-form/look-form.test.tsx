import { LOOK_EDIT_PANEL_TEST_ID } from '@platform/constants/look-form';
import { LOOK_ROW } from '@platform/constants/look-row';
import { LOOK_SAMPLE_TOKENS_TEST_ID } from '@platform/constants/look-sample';
import messages from '@platform/i18n/messages/en.json';
import { ARIA_SELECTED } from '@platform/testing/aria';
import { screen, within } from '@platform/testing/custom-render';
import {
  ACCENT_HUE,
  EDIT_TAB,
  FOLLOW_ACCENT_HUE,
  PREVIEW_TAB,
} from '@platform/testing/look/look-form-fixtures';
import { openLookRow } from '@platform/testing/look/look-form-interactions';
import { setupLookForm } from '@platform/testing/look/look-form-setup';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { LookForm } from './look-form';

vi.mock('@platform/server/site-config/update-look-action');

vi.mock('@platform/server/site-config/upload-brand-asset-action');

vi.mock('@platform/server/site-config/clear-brand-asset-action');

const { lookForm: LOOK_FORM } = messages;

const COOKIE_BANNER_OFF_NOTE = LOOK_FORM.cookieSettingsButtonBannerOff;

const ROW_TITLES_IN_ORDER = [
  LOOK_FORM.colourHeading,
  LOOK_FORM.brandHeading,
  LOOK_FORM.typeHeading,
  LOOK_FORM.shapeHeading,
  LOOK_FORM.cardsHeading,
  LOOK_FORM.buttonsHeading,
  LOOK_FORM.headerHeading,
  LOOK_FORM.footerHeading,
  LOOK_FORM.languageSwitcherLabel,
];

describe(`<${LookForm.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  describe('with the default values', () => {
    beforeEach(() => {
      setupLookForm();
    });

    it('lists the Preset card, then the Style and Site parts rows in order', () => {
      const editPanel = screen.getByTestId(LOOK_EDIT_PANEL_TEST_ID);
      const presetHeading = within(editPanel).getAllByRole('heading', {
        level: 2,
      });
      const rowHeadings = within(editPanel).getAllByRole('heading', {
        level: 3,
      });
      const presetTitles = presetHeading.map((heading) => heading.textContent);
      const rowTitles = rowHeadings.map((heading) =>
        ROW_TITLES_IN_ORDER.find((title) =>
          heading.textContent?.startsWith(title),
        ),
      );

      expect(presetTitles).toEqual([LOOK_FORM.presetLabel]);
      expect(rowTitles).toEqual(ROW_TITLES_IN_ORDER);
    });

    it('switches between the Edit and Preview tabs', async () => {
      const tabList = screen.getByRole('tablist', {
        name: LOOK_FORM.viewTabsAriaLabel,
      });
      const editTab = within(tabList).getByRole('tab', { name: EDIT_TAB });
      const previewTab = screen.getByRole('tab', { name: PREVIEW_TAB });
      expect(editTab).toHaveAttribute(ARIA_SELECTED, 'true');

      await user.click(previewTab);

      const previewPanel = screen.getByRole('tabpanel', { name: PREVIEW_TAB });
      const sampleTokens = screen.getByTestId(LOOK_SAMPLE_TOKENS_TEST_ID);
      expect(previewTab).toHaveAttribute(ARIA_SELECTED, 'true');
      expect(editTab).toHaveAttribute(ARIA_SELECTED, 'false');
      expect(previewPanel).toContainElement(sampleTokens);
    });

    describe('with the Colour row open', () => {
      beforeEach(async () => {
        await openLookRow(user, LOOK_ROW.COLOUR);
      });

      it("describes each Colour control with its field's hint", () => {
        const hueSlider = screen.getByRole('slider', { name: ACCENT_HUE });
        const followSwitch = screen.getByRole('switch', {
          name: FOLLOW_ACCENT_HUE,
        });

        expect(hueSlider).toHaveAccessibleDescription(
          LOOK_FORM.accentHueDescription,
        );
        expect(followSwitch).toHaveAccessibleDescription(
          LOOK_FORM.logoHueDescription,
        );
      });

      it('names the logo hue group by its label alone', () => {
        const logoHueGroup = screen.getByRole('group', {
          name: LOOK_FORM.logoHueLabel,
        });

        expect(logoHueGroup).toBeVisible();
      });
    });

    describe('with the Corners & spacing row open', () => {
      beforeEach(async () => {
        await openLookRow(user, LOOK_ROW.SHAPE);
      });

      it("describes the corner radius control with its field's hint", () => {
        const radiusGroup = screen.getByRole('group', {
          name: LOOK_FORM.radiusScaleLabel,
        });

        expect(radiusGroup).toHaveAccessibleDescription(
          LOOK_FORM.radiusScaleDescription,
        );
      });
    });

    describe('with the Header row open', () => {
      beforeEach(async () => {
        await openLookRow(user, LOOK_ROW.HEADER);
      });

      it('shows only labels in the header buttons tiles and describes the chosen one below', async () => {
        const headerButtonsField = screen.getByRole('group', {
          name: LOOK_FORM.headerControlStyleLabel,
        });
        const plainButton = within(headerButtonsField).getByRole('button', {
          name: LOOK_FORM.headerControlStyleOptionLabel.PLAIN,
        });
        await user.click(plainButton);
        const toggleGroup = within(headerButtonsField).getByRole('group');

        const tileDescription = within(plainButton).queryByText(
          LOOK_FORM.headerControlStyleOptionDescription.PLAIN,
        );

        expect(tileDescription).not.toBeInTheDocument();
        expect(plainButton).not.toHaveAccessibleDescription();
        expect(toggleGroup).toHaveAccessibleDescription(
          LOOK_FORM.headerControlStyleOptionDescription.PLAIN,
        );
      });
    });

    it.each([
      {
        row: LOOK_ROW.CARDS,
        label: LOOK_FORM.cardStyleLabel,
        initialDescription: LOOK_FORM.cardStyleOptionDescription.ACCENT_BAR,
        option: LOOK_FORM.cardStyleOptionLabel.OUTLINED,
        description: LOOK_FORM.cardStyleOptionDescription.OUTLINED,
      },
      {
        row: LOOK_ROW.LANGUAGE_SWITCHER,
        label: LOOK_FORM.languageSwitcherStyleLabel,
        initialDescription:
          LOOK_FORM.languageSwitcherOptionDescription.MENU_CODE,
        option: LOOK_FORM.languageSwitcherOptionLabel.MENU_GLOBE,
        description: LOOK_FORM.languageSwitcherOptionDescription.MENU_GLOBE,
      },
    ])(
      'describes the chosen $label option below the control',
      async ({ row, label, initialDescription, option, description }) => {
        await openLookRow(user, row);
        const field = screen.getByRole('group', { name: label });
        const optionButton = within(field).getByRole('button', {
          name: option,
        });
        const toggleGroup = within(field).getByRole('group');

        expect(toggleGroup).toHaveAccessibleDescription(initialDescription);

        await user.click(optionButton);

        expect(toggleGroup).toHaveAccessibleDescription(description);
      },
    );
  });

  describe('the cookie settings choice', () => {
    const cookieChoice = async (hasCookieBanner: boolean) => {
      setupLookForm({ hasCookieBanner });
      await openLookRow(user, LOOK_ROW.FOOTER);
      const cookieButtonGroup = screen.getByRole('group', {
        name: LOOK_FORM.cookieSettingsButtonLabel,
      });

      return within(cookieButtonGroup).getByRole('button', {
        name: LOOK_FORM.cookieSettingsButtonOptionLabel.SHOWN,
      });
    };

    it('is editable with no note while the cookie banner is on', async () => {
      const bothButton = await cookieChoice(true);
      const note = screen.queryByText(COOKIE_BANNER_OFF_NOTE);

      expect(bothButton).toBeEnabled();
      expect(note).not.toBeInTheDocument();
    });

    it('is disabled with a note saying why while the cookie banner is off', async () => {
      const bothButton = await cookieChoice(false);
      const note = screen.getByText(COOKIE_BANNER_OFF_NOTE);

      expect(bothButton).toBeDisabled();
      expect(note).toBeVisible();
    });
  });
});
