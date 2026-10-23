import { renderWithIntl, screen } from '@platform/testing/custom-render';
import {
  GO_TO_THE_FIRST_ONE,
  ONE_FIELD_NEEDS_ATTENTION,
  SAVE_CHANGES,
  UNSAVED_CHANGES,
} from '@platform/testing/render-in-settings-form';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { useState } from 'react';

import { SaveBar, type TSaveBarProps } from './save-bar';

const THREE_UNSAVED_CHANGES = '3 unsaved changes';
const DISCARD = 'Discard';
const HEADING = 'Heading';
const FIELD_HEADING_ID = 'field-heading';
const BREAKDOWN = 'English 2 · Deutsch 1';
const SAVE_ERROR = "Couldn't save Look settings — try again.";

const baseProps: TSaveBarProps = {
  changeCount: 3,
  breakdown: '',
  invalidControls: { ids: [] },
  isPending: false,
  onSave: vi.fn(),
  onDiscard: vi.fn(),
};

const renderBar = (overrides: Partial<TSaveBarProps> = {}) =>
  renderWithIntl(<SaveBar {...baseProps} {...overrides} />);

const BarWithHiddenField = () => {
  const [isRevealed, setIsRevealed] = useState(false);

  return (
    <>
      {isRevealed && <input id={FIELD_HEADING_ID} aria-label={HEADING} />}
      <SaveBar
        {...baseProps}
        invalidControls={{
          ids: [FIELD_HEADING_ID],
          revealFirst: () => setIsRevealed(true),
        }}
      />
    </>
  );
};

describe(`<${SaveBar.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  it('shows a single change in the singular', () => {
    renderBar({ changeCount: 1 });

    const changeCount = screen.getByText('1 unsaved change');

    expect(changeCount).toBeVisible();
  });

  it('shows the per-language breakdown beside the count', () => {
    renderBar({ breakdown: BREAKDOWN });

    const changeCount = screen.getByText(THREE_UNSAVED_CHANGES);
    const breakdown = screen.getByText(BREAKDOWN);

    expect(changeCount).toBeVisible();
    expect(breakdown).toBeVisible();
  });

  it('shows the saving state on Save and disables Discard while pending', () => {
    renderBar({ isPending: true });

    const savingButton = screen.getByRole('button', { name: 'Saving…' });
    const discardButton = screen.getByRole('button', { name: DISCARD });

    expect(savingButton).toBeDisabled();
    expect(discardButton).toBeDisabled();
  });

  describe('after a save with field errors', () => {
    beforeEach(() => {
      renderBar({ invalidControls: { ids: [FIELD_HEADING_ID, 'field-body'] } });
    });

    it('counts the fields that need attention in place of the change count', () => {
      const attentionCount = screen.getByText('2 fields need attention');
      const changeCount = screen.queryByText(THREE_UNSAVED_CHANGES);

      expect(attentionCount).toBeVisible();
      expect(changeCount).not.toBeInTheDocument();
    });

    it('links to the first field that needs attention', () => {
      const firstFieldLink = screen.getByRole('link', {
        name: GO_TO_THE_FIRST_ONE,
      });

      expect(firstFieldLink).toHaveAttribute('href', `#${FIELD_HEADING_ID}`);
    });

    it('focuses the first field from the link', async () => {
      renderWithIntl(<input id={FIELD_HEADING_ID} aria-label={HEADING} />);

      const firstFieldLink = screen.getByRole('link', {
        name: GO_TO_THE_FIRST_ONE,
      });
      await user.click(firstFieldLink);

      const headingField = screen.getByRole('textbox', { name: HEADING });

      expect(headingField).toHaveFocus();
    });

    it('focuses the control inside a first field that cannot take focus', async () => {
      renderWithIntl(
        <div id={FIELD_HEADING_ID}>
          <input aria-label={HEADING} />
        </div>,
      );

      const firstFieldLink = screen.getByRole('link', {
        name: GO_TO_THE_FIRST_ONE,
      });
      await user.click(firstFieldLink);

      const headingField = screen.getByRole('textbox', { name: HEADING });

      expect(headingField).toHaveFocus();
    });

    it('keeps Save and Discard available', () => {
      const saveButton = screen.getByRole('button', { name: SAVE_CHANGES });
      const discardButton = screen.getByRole('button', { name: DISCARD });

      expect(saveButton).toBeEnabled();
      expect(discardButton).toBeEnabled();
    });
  });

  it('lets the page reveal the first field before focusing it', async () => {
    renderWithIntl(<BarWithHiddenField />);

    const firstFieldLink = screen.getByRole('link', {
      name: GO_TO_THE_FIRST_ONE,
    });
    await user.click(firstFieldLink);

    const headingField = screen.getByRole('textbox', { name: HEADING });

    expect(headingField).toHaveFocus();
  });

  describe('after a save that failed', () => {
    it('announces the error beside Save when no field caused it', () => {
      renderBar({ saveError: SAVE_ERROR });

      const alert = screen.getByRole('alert');
      const changeCount = screen.queryByText(THREE_UNSAVED_CHANGES);

      expect(alert).toHaveTextContent(SAVE_ERROR);
      expect(changeCount).not.toBeInTheDocument();
    });

    it('says the save did not go through and links to the field that caused it', () => {
      renderBar({
        saveError: "Couldn't upload the logo — try again.",
        invalidControls: { ids: ['field-logo'] },
      });

      const region = screen.getByRole('region', { name: UNSAVED_CHANGES });
      const link = screen.getByRole('link', { name: GO_TO_THE_FIRST_ONE });
      const alert = screen.queryByRole('alert');

      expect(region).toHaveTextContent('Not saved');
      expect(region).toHaveTextContent(ONE_FIELD_NEEDS_ATTENTION);
      expect(link).toHaveAttribute('href', '#field-logo');
      expect(alert).not.toBeInTheDocument();
    });
  });
});
