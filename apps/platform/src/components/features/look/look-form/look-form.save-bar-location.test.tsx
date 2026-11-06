import { LOOK_LAYOUT_LIMIT } from '@platform/constants/look-layout';
import { LOOK_ROW } from '@platform/constants/look-row';
import messages from '@platform/i18n/messages/en.json';
import { screen, within } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import {
  EDIT_TAB,
  EXTRA_LARGE,
  PREVIEW_TAB,
} from '@platform/testing/look/look-form-fixtures';
import {
  chooseEditorial,
  nudgeAccentHue,
  openLookRow,
} from '@platform/testing/look/look-form-interactions';
import { setupLookForm } from '@platform/testing/look/look-form-setup';
import { UNSAVED_CHANGES } from '@platform/testing/render-in-settings-form';
import {
  resizeObservedElements,
  stubResizeObserver,
} from '@platform/testing/resize-observer';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { LookForm } from './look-form';

vi.mock('@platform/server/site-config/update-look-action');

vi.mock('@platform/server/site-config/upload-brand-asset-action');

vi.mock('@platform/server/site-config/clear-brand-asset-action');

const { lookForm: LOOK_FORM } = messages;

const tSaveBar = makeEnTranslator('saveBar');

const pickExtraLargeRadius = async (user: UserEvent) => {
  await openLookRow(user, LOOK_ROW.SHAPE);
  const extraLargeButton = screen.getByRole('button', { name: EXTRA_LARGE });
  await user.click(extraLargeButton);
};

describe(`<${LookForm.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  describe('the save bar location', () => {
    beforeEach(async () => {
      setupLookForm();
      await nudgeAccentHue(user);
    });

    it('names the one changed card by its row title', () => {
      const saveBar = screen.getByRole('region', { name: UNSAVED_CHANGES });
      const colourLink = within(saveBar).getByRole('button', {
        name: LOOK_FORM.colourHeading,
      });

      expect(colourLink).toBeVisible();
    });

    it('counts the changed cards and names none once a second card changes', async () => {
      await pickExtraLargeRadius(user);

      const saveBar = screen.getByRole('region', { name: UNSAVED_CHANGES });
      const location = within(saveBar).getByText(
        tSaveBar('inCards', { cards: 2 }),
      );
      const colourLink = within(saveBar).queryByRole('button', {
        name: LOOK_FORM.colourHeading,
      });
      expect(location).toBeVisible();
      expect(colourLink).not.toBeInTheDocument();
    });

    describe('on the Preview tab', () => {
      beforeEach(async () => {
        const previewTab = screen.getByRole('tab', { name: PREVIEW_TAB });
        await user.click(previewTab);
      });

      it('hides the save bar', () => {
        const saveBar = screen.queryByRole('region', { name: UNSAVED_CHANGES });

        expect(saveBar).not.toBeInTheDocument();
      });

      it('shows the save bar again on the Edit tab with the same changes', async () => {
        const editTab = screen.getByRole('tab', { name: EDIT_TAB });
        await user.click(editTab);

        const saveBar = screen.getByRole('region', { name: UNSAVED_CHANGES });
        expect(saveBar).toHaveTextContent(
          tSaveBar('unsavedChanges', { count: 1 }),
        );
      });
    });
  });

  describe('when the layout widens to two columns on the Preview tab', () => {
    let layoutWidth: number;
    let restoreResizeObserver: () => void;

    beforeEach(async () => {
      layoutWidth = LOOK_LAYOUT_LIMIT.TWO_COLUMN_MIN_WIDTH - 1;
      restoreResizeObserver = stubResizeObserver(() => ({
        width: layoutWidth,
        height: 0,
      }));
      setupLookForm();
      await nudgeAccentHue(user);
      const previewTab = screen.getByRole('tab', { name: PREVIEW_TAB });
      await user.click(previewTab);
      layoutWidth = LOOK_LAYOUT_LIMIT.TWO_COLUMN_MIN_WIDTH;
      await resizeObservedElements();
    });

    afterEach(() => {
      restoreResizeObserver();
    });

    it('shows the save bar again', () => {
      const saveBar = screen.getByRole('region', { name: UNSAVED_CHANGES });

      expect(saveBar).toBeVisible();
    });
  });

  it('counts the cards a new preset changes, never the Preset itself', async () => {
    setupLookForm();
    await chooseEditorial(user);

    const saveBar = screen.getByRole('region', { name: UNSAVED_CHANGES });
    const location = within(saveBar).getByText(
      tSaveBar('inCards', { cards: 4 }),
    );
    const presetLink = within(saveBar).queryByRole('button', {
      name: LOOK_FORM.presetLabel,
    });
    expect(location).toBeVisible();
    expect(presetLink).not.toBeInTheDocument();
  });
});
