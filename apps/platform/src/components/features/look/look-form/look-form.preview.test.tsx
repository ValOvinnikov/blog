import { BUSY_BUTTON_STYLE, SPINNER_STYLE } from '@blog/config';
import { LOOK_ROW } from '@platform/constants/look-row';
import { LOOK_SAMPLE_TOKENS_TEST_ID } from '@platform/constants/look-sample';
import {
  SAMPLE_BUSY_BUTTON_TEST_ID,
  SAMPLE_BUSY_STYLE_ATTRIBUTE,
  SAMPLE_SPINNER_VARIANT_ATTRIBUTE,
} from '@platform/constants/sample-busy';
import messages from '@platform/i18n/messages/en.json';
import { ARIA_SELECTED } from '@platform/testing/aria';
import { screen, within } from '@platform/testing/custom-render';
import {
  COMPACT,
  EDIT_TAB,
  EXTRA_LARGE,
  PREVIEW_TAB,
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

    it('shows the chosen busy style and spinner on the preview busy button', async () => {
      await openLookRow(user, LOOK_ROW.BUTTONS);
      await chooseOption(
        user,
        SPINNER_LABEL,
        LOOK_FORM.spinnerStyleOptionLabel.PULSE,
      );
      const busyGroup = screen.getByRole('group', {
        name: LOOK_FORM.busyButtonStyleLabel,
      });
      const edgeButton = within(busyGroup).getByRole('button', {
        name: LOOK_FORM.busyButtonStyleOptionLabel.EDGE,
      });
      await user.click(edgeButton);

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

    it("takes the new preset's spinner when the preset changes", async () => {
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
