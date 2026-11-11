import {
  FOOTER_LAYOUT,
  HEADER_BAR_STYLE,
  HEADER_CONTROL_SHAPE,
  HEADER_CONTROL_SHAPE_DECLARATIONS,
  HEADER_LAYOUT,
} from '@blog/config';
import { LOOK_ROW } from '@platform/constants/look-row';
import { LOOK_SAMPLE_TOKENS_TEST_ID } from '@platform/constants/look-sample';
import {
  SAMPLE_FOOTER_LAYOUT_ATTRIBUTE,
  SAMPLE_FOOTER_TEST_ID,
} from '@platform/constants/sample-footer';
import {
  SAMPLE_HEADER_BAR_STYLE_ATTRIBUTE,
  SAMPLE_HEADER_FULL_TEST_ID,
  SAMPLE_HEADER_LAYOUT_ATTRIBUTE,
  SAMPLE_HEADER_TEST_ID,
} from '@platform/constants/sample-header';
import messages from '@platform/i18n/messages/en.json';
import { screen, within } from '@platform/testing/custom-render';
import {
  FOOTER_LAYOUT_LABEL,
  HEADER_LAYOUT_LABEL,
} from '@platform/testing/look/look-form-fixtures';
import {
  chooseOption,
  chooseSegment,
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
        await chooseSegment(
          user,
          FOOTER_LAYOUT_LABEL,
          LOOK_FORM.footerLayoutOptionLabel.CENTRED,
        );

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
          SAMPLE_FOOTER_LAYOUT_ATTRIBUTE,
          FOOTER_LAYOUT.CENTRED,
        );
      });

      it('previews the chosen navigation link style before saving', async () => {
        await chooseSegment(
          user,
          LOOK_FORM.navLinkStyleLabel,
          LOOK_FORM.navLinkStyleOptionLabel.UNDERLINE,
        );

        const sampleTokens = screen.getByTestId(LOOK_SAMPLE_TOKENS_TEST_ID);
        expect(sampleTokens).toHaveStyle({
          '--nav-link-decoration': 'underline',
        });
      });

      it('previews the chosen header buttons shape before saving', async () => {
        await chooseSegment(
          user,
          LOOK_FORM.headerControlShapeLabel,
          LOOK_FORM.headerControlShapeOptionLabel.SQUARE,
        );

        const sampleTokens = screen.getByTestId(LOOK_SAMPLE_TOKENS_TEST_ID);
        expect(sampleTokens).toHaveStyle(
          HEADER_CONTROL_SHAPE_DECLARATIONS[HEADER_CONTROL_SHAPE.SQUARE],
        );
      });
    });
  });
});
