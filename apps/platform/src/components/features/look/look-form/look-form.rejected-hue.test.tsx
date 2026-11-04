import { isAccentHueAccessible } from '@blog/config';
import type * as BlogConfig from '@blog/config';
import { LOOK_ROW } from '@platform/constants/look-row';
import messages from '@platform/i18n/messages/en.json';
import { updateLookAction } from '@platform/server/site-config/update-look-action';
import { ARIA_SELECTED } from '@platform/testing/aria';
import { screen } from '@platform/testing/custom-render';
import { USER_EVENT_KEY } from '@platform/testing/keyboard';
import {
  ACCENT_HUE,
  EDIT_TAB,
  NUDGED_ACCENT_HUE,
  PREVIEW_TAB,
} from '@platform/testing/look/look-form-fixtures';
import {
  clickGoToTheFirstOne,
  clickSave,
  nudgeAccentHue,
  openLookRow,
} from '@platform/testing/look/look-form-interactions';
import {
  setupArchived,
  setupLookForm,
} from '@platform/testing/look/look-form-setup';
import {
  ARCHIVED_NOTICE_DESCRIPTION,
  ONE_FIELD_NEEDS_ATTENTION,
} from '@platform/testing/render-in-settings-form';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { LookForm } from './look-form';

vi.mock('@blog/config', async (importOriginal) => ({
  ...(await importOriginal<typeof BlogConfig>()),
  isAccentHueAccessible: vi.fn(() => true),
}));

vi.mock('@platform/server/site-config/update-look-action');

vi.mock('@platform/server/site-config/upload-brand-asset-action');

vi.mock('@platform/server/site-config/clear-brand-asset-action');

const { lookForm: LOOK_FORM } = messages;

const REJECTED_ACCENT_HUE_DESCRIPTION = `${LOOK_FORM.accentHueDescription} ${LOOK_FORM.accentHueInaccessible}`;

describe(`<${LookForm.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    vi.mocked(isAccentHueAccessible).mockReset();
  });

  describe('when the accent hue is rejected', () => {
    beforeEach(async () => {
      vi.mocked(isAccentHueAccessible).mockImplementation(
        (hue) => hue !== NUDGED_ACCENT_HUE,
      );
      setupLookForm();
      await nudgeAccentHue(user);
      await user.tab();
    });

    it('explains the rejection on the slider and flags one field', () => {
      const slider = screen.getByRole('slider', { name: ACCENT_HUE });
      const attentionNote = screen.getByText(ONE_FIELD_NEEDS_ATTENTION);

      expect(slider).toHaveAccessibleDescription(
        REJECTED_ACCENT_HUE_DESCRIPTION,
      );
      expect(attentionNote).toBeVisible();
    });

    it('does not save while the hue is rejected', async () => {
      await clickSave(user);

      expect(updateLookAction).not.toHaveBeenCalled();
    });

    it.each([
      { source: 'the save bar link', act: clickGoToTheFirstOne },
      { source: 'a refused Save', act: clickSave },
    ])('focuses the accent hue slider from $source', async ({ act }) => {
      await act(user);

      const slider = screen.getByRole('slider', { name: ACCENT_HUE });
      expect(slider).toHaveFocus();
    });

    it('returns to the Edit tab to focus the accent hue slider from the Preview', async () => {
      const previewTab = screen.getByRole('tab', { name: PREVIEW_TAB });
      await user.click(previewTab);
      await user.keyboard(USER_EVENT_KEY.CONTROL_S);

      const editTab = screen.getByRole('tab', { name: EDIT_TAB });
      const slider = screen.getByRole('slider', { name: ACCENT_HUE });
      expect(editTab).toHaveAttribute(ARIA_SELECTED, 'true');
      expect(slider).toHaveFocus();
    });
  });

  describe('archived tenant', () => {
    it('describes a rejected accent hue with both the archived notice and the error', async () => {
      vi.mocked(isAccentHueAccessible).mockReturnValue(false);
      setupArchived();
      await openLookRow(user, LOOK_ROW.COLOUR);

      const slider = screen.getByRole('slider', { name: ACCENT_HUE });

      expect(slider).toHaveAccessibleDescription(
        `${ARCHIVED_NOTICE_DESCRIPTION} ${REJECTED_ACCENT_HUE_DESCRIPTION}`,
      );
    });
  });
});
