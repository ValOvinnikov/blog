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

    describe('with the Shape row open', () => {
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

      it('describes each header buttons option', () => {
        const headerButtonsGroup = screen.getByRole('group', {
          name: LOOK_FORM.headerControlStyleLabel,
        });
        const plainButton = within(headerButtonsGroup).getByRole('button', {
          name: LOOK_FORM.headerControlStyleOptionLabel.PLAIN,
        });

        expect(plainButton).toHaveAccessibleDescription(
          LOOK_FORM.headerControlStyleOptionDescription.PLAIN,
        );
      });
    });
  });

  it.each([
    { banner: 'on', hasCookieBanner: true, isNoteShown: false },
    { banner: 'off', hasCookieBanner: false, isNoteShown: true },
  ])(
    'keeps the cookie button editable with the banner $banner, noting when off',
    async ({ hasCookieBanner, isNoteShown }) => {
      setupLookForm({ hasCookieBanner });
      await openLookRow(user, LOOK_ROW.FOOTER);

      const note = screen.queryByText(COOKIE_BANNER_OFF_NOTE);
      const cookieButtonGroup = screen.getByRole('group', {
        name: LOOK_FORM.cookieSettingsButtonLabel,
      });
      const shownButton = within(cookieButtonGroup).getByRole('button', {
        name: LOOK_FORM.cookieSettingsButtonOptionLabel.SHOWN,
      });

      expect(Boolean(note)).toBe(isNoteShown);
      expect(shownButton).toBeEnabled();
    },
  );
});
