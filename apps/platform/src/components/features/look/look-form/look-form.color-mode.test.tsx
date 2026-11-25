import { LOOK_ROW } from '@platform/constants/look-row';
import messages from '@platform/i18n/messages/en.json';
import { ARIA_DISABLED, ARIA_PRESSED } from '@platform/testing/aria';
import { screen, within } from '@platform/testing/custom-render';
import { GROWTH_BADGE_TEXT } from '@platform/testing/look/look-form-fixtures';
import {
  chooseSegment,
  openLookRow,
} from '@platform/testing/look/look-form-interactions';
import { saveAndExpectLook } from '@platform/testing/look/look-form-save';
import {
  setupLookForm,
  withLookPlan,
} from '@platform/testing/look/look-form-setup';
import { COLOR_MODE } from '@shinefold/config';
import { TENANT_PLAN } from '@shinefold/config/constants';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { LookForm } from './look-form';

vi.mock('@platform/server/site-config/update-look-action');

vi.mock('@platform/server/site-config/upload-brand-asset-action');

vi.mock('@platform/server/site-config/clear-brand-asset-action');

const { lookForm: LOOK_FORM, previewModeControl: PREVIEW_MODE_CONTROL } =
  messages;
const COLOR_MODE_OPTION = LOOK_FORM.colorModeOptionLabel;

const previewModeButton = (name: string) =>
  screen.queryByRole('button', { name });

describe(`<${LookForm.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  describe('on Growth', () => {
    beforeEach(async () => {
      setupLookForm();
      await openLookRow(user, LOOK_ROW.COLOUR);
    });

    it.each([
      {
        option: COLOR_MODE_OPTION.DARK,
        shown: PREVIEW_MODE_CONTROL.modeDark,
        removed: PREVIEW_MODE_CONTROL.modeLight,
      },
      {
        option: COLOR_MODE_OPTION.LIGHT,
        shown: PREVIEW_MODE_CONTROL.modeLight,
        removed: PREVIEW_MODE_CONTROL.modeDark,
      },
    ])(
      'previews only the $shown view once $option is chosen',
      async ({ option, shown, removed }) => {
        await chooseSegment(user, LOOK_FORM.colorModeLabel, option);

        expect(previewModeButton(shown)).toHaveAttribute(ARIA_PRESSED, 'true');
        expect(previewModeButton(removed)).not.toBeInTheDocument();
      },
    );

    describe('with Always dark chosen', () => {
      beforeEach(async () => {
        await chooseSegment(
          user,
          LOOK_FORM.colorModeLabel,
          COLOR_MODE_OPTION.DARK,
        );
      });

      it('restores both preview views when the reader chooses again', async () => {
        await chooseSegment(
          user,
          `${LOOK_FORM.colorModeLabel} ${LOOK_FORM.fieldUnsavedLabel}`,
          COLOR_MODE_OPTION.READER,
        );

        expect(
          previewModeButton(PREVIEW_MODE_CONTROL.modeLight),
        ).toBeInTheDocument();
        expect(
          previewModeButton(PREVIEW_MODE_CONTROL.modeDark),
        ).toBeInTheDocument();
      });

      it('saves the chosen colour mode', async () => {
        await saveAndExpectLook(user, { colorMode: COLOR_MODE.DARK });
      });
    });
  });

  describe.each([TENANT_PLAN.FREE, TENANT_PLAN.STARTER])('on %s', (plan) => {
    beforeEach(async () => {
      setupLookForm(withLookPlan(plan));
      await openLookRow(user, LOOK_ROW.COLOUR);
    });

    it('shows the colour mode locked at Reader chooses with the plan it comes with', async () => {
      const group = screen.getByRole('group', {
        name: `${LOOK_FORM.colorModeLabel} ${GROWTH_BADGE_TEXT}`,
      });
      const readerButton = within(group).getByRole('button', {
        name: COLOR_MODE_OPTION.READER,
      });
      const darkButton = within(group).getByRole('button', {
        name: COLOR_MODE_OPTION.DARK,
      });

      await user.click(darkButton);

      expect(readerButton).toHaveAttribute(ARIA_PRESSED, 'true');
      expect(darkButton).toHaveAttribute(ARIA_DISABLED, 'true');
    });
  });
});
