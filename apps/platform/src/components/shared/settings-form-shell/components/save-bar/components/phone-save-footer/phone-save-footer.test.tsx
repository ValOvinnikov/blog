import { faker } from '@faker-js/faker';
import {
  customRender,
  renderWithIntl,
  screen,
} from '@platform/testing/custom-render';
import {
  ALL_CHANGES_SAVED,
  GO_TO_THE_FIRST_ONE,
  SAVE_CHANGES,
} from '@platform/testing/render-in-settings-form';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { useState } from 'react';

import {
  PhoneSaveFooter,
  type TPhoneSaveFooterProps,
} from './phone-save-footer';

faker.seed(6414);

const ONE_UNSAVED_CHANGE = '1 unsaved change';
const ONE_FIELD_NEEDS_ATTENTION = '1 field needs attention';
const SAVING = 'Saving…';
const MOCK_FIELD_LABEL = faker.lorem.word();
const MOCK_FIELD_ID = faker.string.alpha(10);
const MOCK_SECOND_FIELD_ID = faker.string.alpha(10);

const baseProps: TPhoneSaveFooterProps = {
  changeCount: 1,
  invalidControls: { ids: [] },
  isPending: false,
  onSave: vi.fn(),
};

const setup = customRender(PhoneSaveFooter, baseProps);

const FooterWithHiddenField = () => {
  const [isRevealed, setIsRevealed] = useState(false);

  return (
    <>
      {isRevealed && <input id={MOCK_FIELD_ID} aria-label={MOCK_FIELD_LABEL} />}
      <PhoneSaveFooter
        {...baseProps}
        invalidControls={{
          ids: [MOCK_FIELD_ID],
          revealFirst: () => setIsRevealed(true),
        }}
      />
    </>
  );
};

describe(`<${PhoneSaveFooter.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  describe('with unsaved changes', () => {
    it('is a region named by its change count', () => {
      setup();

      const footer = screen.getByRole('region', { name: ONE_UNSAVED_CHANGE });

      expect(footer).toBeVisible();
    });

    it('saves from an enabled Save changes', async () => {
      const onSave = vi.fn();
      setup({ onSave });

      const saveButton = screen.getByRole('button', { name: SAVE_CHANGES });
      await user.click(saveButton);

      expect(onSave).toHaveBeenCalledTimes(1);
    });

    it('offers no Discard and no shortcut', () => {
      setup();

      const footer = screen.getByRole('region', { name: ONE_UNSAVED_CHANGE });
      const buttons = screen.getAllByRole('button');

      expect(buttons).toHaveLength(1);
      expect(footer).toHaveTextContent(`${ONE_UNSAVED_CHANGE}${SAVE_CHANGES}`);
    });
  });

  describe('with nothing unsaved', () => {
    beforeEach(() => {
      setup({ changeCount: 0 });
    });

    it('is a region named "All changes saved"', () => {
      const footer = screen.getByRole('region', { name: ALL_CHANGES_SAVED });

      expect(footer).toBeVisible();
    });

    it('disables Save changes', () => {
      const saveButton = screen.getByRole('button', { name: SAVE_CHANGES });

      expect(saveButton).toBeDisabled();
    });
  });

  describe('with fields that need attention', () => {
    it('is a region named by the count of fields that need attention', () => {
      setup({ invalidControls: { ids: [MOCK_FIELD_ID] } });

      const footer = screen.getByRole('region', {
        name: ONE_FIELD_NEEDS_ATTENTION,
      });

      expect(footer).toHaveTextContent(
        `${ONE_FIELD_NEEDS_ATTENTION}${GO_TO_THE_FIRST_ONE}${SAVE_CHANGES}`,
      );
    });

    it('counts two fields in the plural', () => {
      setup({
        invalidControls: { ids: [MOCK_FIELD_ID, MOCK_SECOND_FIELD_ID] },
      });

      const footer = screen.getByRole('region', {
        name: '2 fields need attention',
      });

      expect(footer).toBeVisible();
    });

    it('keeps Save changes enabled', () => {
      setup({ invalidControls: { ids: [MOCK_FIELD_ID] } });

      const saveButton = screen.getByRole('button', { name: SAVE_CHANGES });

      expect(saveButton).toBeEnabled();
    });

    it('reveals and focuses the first field from "Go to the first one"', async () => {
      renderWithIntl(<FooterWithHiddenField />);

      const firstFieldLink = screen.getByRole('link', {
        name: GO_TO_THE_FIRST_ONE,
      });
      await user.click(firstFieldLink);

      const firstField = screen.getByRole('textbox', {
        name: MOCK_FIELD_LABEL,
      });

      expect(firstField).toHaveFocus();
    });
  });

  describe('while saving', () => {
    it('marks the footer busy', () => {
      setup({ isPending: true });

      const footer = screen.getByRole('region', { name: ONE_UNSAVED_CHANGE });

      expect(footer).toHaveAttribute('aria-busy', 'true');
    });

    it('keeps Saving… focusable while ignoring presses', async () => {
      const onSave = vi.fn();
      setup({ isPending: true, onSave });

      const savingButton = screen.getByRole('button', { name: SAVING });
      await user.click(savingButton);

      expect(savingButton).toHaveFocus();
      expect(savingButton).toHaveAttribute('aria-disabled', 'true');
      expect(onSave).not.toHaveBeenCalled();
    });

    it('announces Saving… once', () => {
      setup({ isPending: true });

      const announcement = screen.getByRole('status');

      expect(announcement).toHaveTextContent(SAVING);
    });
  });
});
