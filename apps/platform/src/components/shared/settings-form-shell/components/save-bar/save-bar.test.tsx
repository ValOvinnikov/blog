import { faker } from '@faker-js/faker';
import {
  customRender,
  renderWithIntl,
  screen,
} from '@platform/testing/custom-render';
import {
  GO_TO_THE_FIRST_ONE,
  ONE_FIELD_NEEDS_ATTENTION,
  SAVE_CHANGES,
  UNSAVED_CHANGES,
} from '@platform/testing/render-in-settings-form';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { useState, type ReactNode } from 'react';

import { SaveBar, type TSaveBarProps } from './save-bar';

faker.seed(5995);

const THREE_UNSAVED_CHANGES = '3 unsaved changes';
const DISCARD = 'Discard';
const MOCK_FIELD_LABEL = faker.lorem.word();
const MOCK_FIELD_ID = faker.string.alpha(10);
const MOCK_SECOND_FIELD_ID = faker.string.alpha(10);
const MOCK_BREAKDOWN = faker.lorem.words(3);
const MOCK_SAVE_ERROR = faker.lorem.sentence();

const baseProps: TSaveBarProps = {
  changeCount: 3,
  breakdown: '',
  invalidControls: { ids: [] },
  isPending: false,
  onSave: vi.fn(),
  onDiscard: vi.fn(),
};

const setup = customRender(SaveBar, baseProps);

const BarWithHiddenField = () => {
  const [isRevealed, setIsRevealed] = useState(false);

  return (
    <>
      {isRevealed && <input id={MOCK_FIELD_ID} aria-label={MOCK_FIELD_LABEL} />}
      <SaveBar
        {...baseProps}
        invalidControls={{
          ids: [MOCK_FIELD_ID],
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
    setup({ changeCount: 1 });

    const changeCount = screen.getByText('1 unsaved change');

    expect(changeCount).toBeVisible();
  });

  it('shows the per-language breakdown beside the count', () => {
    setup({ breakdown: MOCK_BREAKDOWN });

    const changeCount = screen.getByText(THREE_UNSAVED_CHANGES);
    const breakdown = screen.getByText(MOCK_BREAKDOWN);

    expect(changeCount).toBeVisible();
    expect(breakdown).toBeVisible();
  });

  it('shows the saving state on Save and disables Discard while pending', () => {
    setup({ isPending: true });

    const savingButton = screen.getByRole('button', { name: 'Saving…' });
    const discardButton = screen.getByRole('button', { name: DISCARD });

    expect(savingButton).toBeDisabled();
    expect(discardButton).toBeDisabled();
  });

  describe('after a save with field errors', () => {
    beforeEach(() => {
      setup({
        invalidControls: { ids: [MOCK_FIELD_ID, MOCK_SECOND_FIELD_ID] },
      });
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

      expect(firstFieldLink).toHaveAttribute('href', `#${MOCK_FIELD_ID}`);
    });

    it('keeps Save and Discard available', () => {
      const saveButton = screen.getByRole('button', { name: SAVE_CHANGES });
      const discardButton = screen.getByRole('button', { name: DISCARD });

      expect(saveButton).toBeEnabled();
      expect(discardButton).toBeEnabled();
    });
  });

  describe('going to the first field', () => {
    it.each<{ fieldKind: string; field: ReactNode }>([
      {
        fieldKind: 'the field itself',
        field: <input id={MOCK_FIELD_ID} aria-label={MOCK_FIELD_LABEL} />,
      },
      {
        fieldKind: 'the control inside a field that cannot take focus',
        field: (
          <div id={MOCK_FIELD_ID}>
            <input aria-label={MOCK_FIELD_LABEL} />
          </div>
        ),
      },
    ])('focuses $fieldKind', async ({ field }) => {
      renderWithIntl(
        <>
          {field}
          <SaveBar {...baseProps} invalidControls={{ ids: [MOCK_FIELD_ID] }} />
        </>,
      );

      const firstFieldLink = screen.getByRole('link', {
        name: GO_TO_THE_FIRST_ONE,
      });
      await user.click(firstFieldLink);

      const firstField = screen.getByRole('textbox', {
        name: MOCK_FIELD_LABEL,
      });

      expect(firstField).toHaveFocus();
    });

    it('lets the page reveal the first field before focusing it', async () => {
      renderWithIntl(<BarWithHiddenField />);

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

  describe('after a save that failed', () => {
    it('announces the error beside Save when no field caused it', () => {
      setup({ saveError: MOCK_SAVE_ERROR });

      const alert = screen.getByRole('alert');
      const changeCount = screen.queryByText(THREE_UNSAVED_CHANGES);

      expect(alert).toHaveTextContent(MOCK_SAVE_ERROR);
      expect(changeCount).not.toBeInTheDocument();
    });

    it('says the save failed and links to the field that caused it', () => {
      setup({
        saveError: MOCK_SAVE_ERROR,
        invalidControls: { ids: [MOCK_FIELD_ID] },
      });

      const region = screen.getByRole('region', { name: UNSAVED_CHANGES });
      const link = screen.getByRole('link', { name: GO_TO_THE_FIRST_ONE });
      const alert = screen.queryByRole('alert');

      expect(region).toHaveTextContent('Not saved');
      expect(region).toHaveTextContent(ONE_FIELD_NEEDS_ATTENTION);
      expect(link).toHaveAttribute('href', `#${MOCK_FIELD_ID}`);
      expect(alert).not.toBeInTheDocument();
    });
  });
});
