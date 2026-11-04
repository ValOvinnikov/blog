import {
  BUSY_BUTTON_STYLE,
  FOOTER_LAYOUT,
  HEADER_BAR_STYLE,
  HEADER_LAYOUT,
  SPINNER_STYLE,
} from '@blog/config';
import { LOOK_ROW } from '@platform/constants/look-row';
import { LOOK_SAMPLE_TOKENS_TEST_ID } from '@platform/constants/look-sample';
import {
  SAMPLE_BUSY_BUTTON_TEST_ID,
  SAMPLE_BUSY_STYLE_ATTRIBUTE,
  SAMPLE_SPINNER_VARIANT_ATTRIBUTE,
} from '@platform/constants/sample-busy';
import { SAMPLE_FOOTER_TEST_ID } from '@platform/constants/sample-footer';
import {
  SAMPLE_HEADER_BAR_STYLE_ATTRIBUTE,
  SAMPLE_HEADER_FULL_TEST_ID,
  SAMPLE_HEADER_LAYOUT_ATTRIBUTE,
  SAMPLE_HEADER_TEST_ID,
} from '@platform/constants/sample-header';
import messages from '@platform/i18n/messages/en.json';
import { screen, within } from '@platform/testing/custom-render';
import {
  COMPACT,
  EXTRA_LARGE,
  FOOTER_LAYOUT_LABEL,
  HEADER_LAYOUT_LABEL,
  SPINNER_LABEL,
} from '@platform/testing/look/look-form-fixtures';
import {
  chooseEditorial,
  chooseOption,
  openLookRow,
} from '@platform/testing/look/look-form-interactions';
import { setupLookForm } from '@platform/testing/look/look-form-setup';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { LookForm } from './look-form';

vi.mock('@platform/server/site-config/update-look-action');

vi.mock('@platform/server/site-config/upload-brand-asset-action');

vi.mock('@platform/server/site-config/clear-brand-asset-action');

const { lookForm: LOOK_FORM, lookPreview: LOOK_PREVIEW } = messages;

describe(`<${LookForm.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  describe('with the default values', () => {
    beforeEach(() => {
      setupLookForm();
    });

    describe('with the Shape row open', () => {
      beforeEach(async () => {
        await openLookRow(user, LOOK_ROW.SHAPE);
      });

      it('previews a changed radius scale and density before saving', async () => {
        const extraLargeButton = screen.getByRole('button', {
          name: EXTRA_LARGE,
        });
        await user.click(extraLargeButton);
        const compactButton = screen.getByRole('button', { name: COMPACT });
        await user.click(compactButton);

        const sampleTokens = screen.getByTestId(LOOK_SAMPLE_TOKENS_TEST_ID);
        expect(sampleTokens).toHaveStyle({
          '--radius-md': '16px',
          '--spacing-card-x': '0.75rem',
        });
      });
    });

    describe('with the Header row open', () => {
      beforeEach(async () => {
        await openLookRow(user, LOOK_ROW.HEADER);
      });

      it('previews the chosen account panel open while signed in', async () => {
        const hubButton = screen.getByRole('button', {
          name: LOOK_FORM.accountPanelStyleOptionLabel.HUB,
        });
        await user.click(hubButton);
        const signedInButton = screen.getByRole('button', {
          name: LOOK_PREVIEW.readerSignedIn,
        });
        await user.click(signedInButton);

        const fullHeader = screen.getByTestId(SAMPLE_HEADER_FULL_TEST_ID);
        const accountMenu = within(fullHeader).getByRole('menu', {
          name: LOOK_PREVIEW.accountMenuAriaLabel,
        });
        expect(accountMenu).toBeVisible();
        expect(accountMenu).toHaveTextContent(
          LOOK_PREVIEW.myBookmarksDescription,
        );
      });

      it('previews the chosen header layout and bar and footer layout', async () => {
        await chooseOption(
          user,
          HEADER_LAYOUT_LABEL,
          LOOK_FORM.headerLayoutOptionLabel.MENU_BUTTON,
        );
        const barGroup = screen.getByRole('group', {
          name: LOOK_FORM.headerBarStyleLabel,
        });
        const floatingButton = within(barGroup).getByRole('button', {
          name: LOOK_FORM.headerBarStyleOptionLabel.FLOATING,
        });
        await user.click(floatingButton);
        await openLookRow(user, LOOK_ROW.FOOTER);
        const footerLayoutGroup = screen.getByRole('group', {
          name: FOOTER_LAYOUT_LABEL,
        });
        const centredButton = within(footerLayoutGroup).getByRole('button', {
          name: LOOK_FORM.footerLayoutOptionLabel.CENTRED,
        });
        await user.click(centredButton);

        const sampleHeader = screen.getByTestId(SAMPLE_HEADER_TEST_ID);
        const sampleFooter = screen.getByTestId(SAMPLE_FOOTER_TEST_ID);
        expect(sampleHeader).toHaveAttribute(
          SAMPLE_HEADER_LAYOUT_ATTRIBUTE,
          HEADER_LAYOUT.MENU_BUTTON,
        );
        expect(sampleHeader).toHaveAttribute(
          SAMPLE_HEADER_BAR_STYLE_ATTRIBUTE,
          HEADER_BAR_STYLE.FLOATING,
        );
        expect(sampleFooter).toHaveAttribute(
          'data-layout',
          FOOTER_LAYOUT.CENTRED,
        );
      });
    });

    it('shows the chosen busy style and spinner on the preview busy button', async () => {
      await openLookRow(user, LOOK_ROW.BUTTONS);
      const busyGroup = screen.getByRole('group', {
        name: LOOK_FORM.busyButtonStyleLabel,
      });
      const edgeButton = within(busyGroup).getByRole('button', {
        name: LOOK_FORM.busyButtonStyleOptionLabel.EDGE,
      });
      await user.click(edgeButton);
      await chooseOption(
        user,
        SPINNER_LABEL,
        LOOK_FORM.spinnerStyleOptionLabel.PULSE,
      );

      const sample = screen.getByTestId(SAMPLE_BUSY_BUTTON_TEST_ID);
      expect(sample).toHaveAttribute(
        SAMPLE_BUSY_STYLE_ATTRIBUTE,
        BUSY_BUTTON_STYLE.EDGE,
      );
      expect(sample).toHaveAttribute(
        SAMPLE_SPINNER_VARIANT_ATTRIBUTE,
        SPINNER_STYLE.PULSE,
      );
    });

    it('follows the preset spinner until one is chosen', async () => {
      const sample = screen.getByTestId(SAMPLE_BUSY_BUTTON_TEST_ID);
      expect(sample).toHaveAttribute(
        SAMPLE_SPINNER_VARIANT_ATTRIBUTE,
        SPINNER_STYLE.BRAILLE,
      );

      await chooseEditorial(user);

      expect(sample).toHaveAttribute(
        SAMPLE_SPINNER_VARIANT_ATTRIBUTE,
        SPINNER_STYLE.RING,
      );
    });
  });
});
