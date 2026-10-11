import { renderWithIntl, screen } from '@platform/testing/custom-render';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';

import { SaveBar, type TSaveBarProps } from './save-bar';

const baseProps: TSaveBarProps = {
  changeCount: 3,
  breakdown: '',
  invalidFields: { ids: [] },
  saveButtonLabel: 'Save changes',
  savingButtonLabel: 'Saving…',
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
      {isRevealed && <input id="field-heading" aria-label="Heading" />}
      <SaveBar
        {...baseProps}
        invalidFields={{
          ids: ['field-heading'],
          revealFirst: () => setIsRevealed(true),
        }}
      />
    </>
  );
};

describe(`<${SaveBar.name}/>`, () => {
  it('shows a single change in the singular', () => {
    renderBar({ changeCount: 1 });

    expect(screen.getByText('1 unsaved change')).toBeVisible();
  });

  it('shows the per-language breakdown beside the count', () => {
    renderBar({ breakdown: 'English 2 · Deutsch 1' });

    expect(screen.getByText('3 unsaved changes')).toBeVisible();
    expect(screen.getByText('English 2 · Deutsch 1')).toBeVisible();
  });

  it('shows the saving state on Save and disables Discard while pending', () => {
    renderBar({ isPending: true });

    expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Discard' })).toBeDisabled();
  });

  describe('after a save with field errors', () => {
    beforeEach(() => {
      renderBar({ invalidFields: { ids: ['field-heading', 'field-body'] } });
    });

    it('counts the fields that need attention in place of the change count', () => {
      expect(screen.getByText('2 fields need attention')).toBeVisible();
      expect(screen.queryByText('3 unsaved changes')).not.toBeInTheDocument();
    });

    it('links to the first field that needs attention', () => {
      expect(
        screen.getByRole('link', { name: 'Go to the first one' }),
      ).toHaveAttribute('href', '#field-heading');
    });

    it('focuses the first field from the link', async () => {
      renderWithIntl(<input id="field-heading" aria-label="Heading" />);

      await userEvent.click(
        screen.getByRole('link', { name: 'Go to the first one' }),
      );

      expect(screen.getByRole('textbox', { name: 'Heading' })).toHaveFocus();
    });

    it('keeps Save and Discard available', () => {
      expect(
        screen.getByRole('button', { name: 'Save changes' }),
      ).toBeEnabled();
      expect(screen.getByRole('button', { name: 'Discard' })).toBeEnabled();
    });
  });

  it('lets the page reveal the first field before focusing it', async () => {
    renderWithIntl(<BarWithHiddenField />);

    await userEvent.click(
      screen.getByRole('link', { name: 'Go to the first one' }),
    );

    expect(screen.getByRole('textbox', { name: 'Heading' })).toHaveFocus();
  });
});
