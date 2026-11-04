import { faker } from '@faker-js/faker';
import {
  customRender,
  renderWithIntl,
  screen,
} from '@platform/testing/custom-render';
import {
  GO_TO_THE_FIRST_ONE,
  SAVE_CHANGES,
  UNSAVED_CHANGES,
} from '@platform/testing/render-in-settings-form';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { useState, type ReactNode } from 'react';

import { SaveBar, type TSaveBarProps } from './save-bar';

faker.seed(5995);

const THREE_UNSAVED_CHANGES = '3 unsaved changes';
const DISCARD = 'Discard';
const NOT_SAVED = 'Not saved';
const SAVE_SHORTCUT = '⌘S / Ctrl+S';
const MOCK_FIELD_LABEL = faker.lorem.word();
const MOCK_FIELD_ID = faker.string.alpha(10);
const MOCK_SECOND_FIELD_ID = faker.string.alpha(10);
const MOCK_BREAKDOWN = faker.lorem.words(3);
const MOCK_CARD_NAME = faker.lorem.word();
const MOCK_OTHER_CARD_NAME = faker.lorem.words(2);
const IN_PREFIX = /^in /;

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

  describe('where the changes are', () => {
    it('names the one card holding the changes as a link that calls its handler', async () => {
      const onSelect = vi.fn();
      setup({ unsavedCards: [{ name: MOCK_CARD_NAME, onSelect }] });

      const region = screen.getByRole('region', { name: UNSAVED_CHANGES });
      const cardLink = screen.getByRole('button', { name: MOCK_CARD_NAME });
      await user.click(cardLink);

      expect(region).toHaveTextContent(
        `${THREE_UNSAVED_CHANGES}in ${MOCK_CARD_NAME}`,
      );
      expect(onSelect).toHaveBeenCalledTimes(1);
    });

    it('counts the cards without naming them when there are several', () => {
      setup({
        unsavedCards: [
          { name: MOCK_CARD_NAME, onSelect: vi.fn() },
          { name: MOCK_OTHER_CARD_NAME, onSelect: vi.fn() },
        ],
      });

      const location = screen.getByText('in 2 cards');
      const cardLink = screen.queryByRole('button', { name: MOCK_CARD_NAME });

      expect(location).toBeVisible();
      expect(cardLink).not.toBeInTheDocument();
    });

    it('shows no location when the caller passes none', () => {
      setup();

      const location = screen.queryByText(IN_PREFIX);

      expect(location).not.toBeInTheDocument();
    });

    it('shows no location while fields need attention', () => {
      setup({
        invalidControls: { ids: [MOCK_FIELD_ID] },
        unsavedCards: [{ name: MOCK_CARD_NAME, onSelect: vi.fn() }],
      });

      const cardLink = screen.queryByRole('button', { name: MOCK_CARD_NAME });

      expect(cardLink).not.toBeInTheDocument();
    });
  });

  describe('while saving', () => {
    beforeEach(() => {
      setup({ isPending: true });
    });

    it('shows the saving state on Save and disables Discard', () => {
      const savingButton = screen.getByRole('button', { name: 'Saving…' });
      const discardButton = screen.getByRole('button', { name: DISCARD });

      expect(savingButton).toHaveAttribute('aria-disabled', 'true');
      expect(discardButton).toBeDisabled();
    });

    it('marks the bar busy', () => {
      const region = screen.getByRole('region', { name: UNSAVED_CHANGES });

      expect(region).toHaveAttribute('aria-busy', 'true');
    });
  });

  describe('after a save with field errors', () => {
    beforeEach(() => {
      setup({
        invalidControls: { ids: [MOCK_FIELD_ID, MOCK_SECOND_FIELD_ID] },
      });
    });

    it('counts the fields that need attention in place of the change count and shortcut', () => {
      const attentionCount = screen.getByText('2 fields need attention');
      const changeCount = screen.queryByText(THREE_UNSAVED_CHANGES);
      const shortcut = screen.queryByText(SAVE_SHORTCUT);

      expect(attentionCount).toBeVisible();
      expect(changeCount).not.toBeInTheDocument();
      expect(shortcut).not.toBeInTheDocument();
    });

    it('says the changes are not saved', () => {
      const region = screen.getByRole('region', { name: UNSAVED_CHANGES });

      expect(region).toHaveTextContent(NOT_SAVED);
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
});
