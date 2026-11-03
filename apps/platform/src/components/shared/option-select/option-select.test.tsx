import { faker } from '@faker-js/faker';
import { KEY } from '@platform/constants/keyboard';
import {
  customRender,
  renderWithIntl,
  screen,
} from '@platform/testing/custom-render';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import type { Mock } from 'vitest';

import { OptionSelect } from './option-select';

faker.seed(6384);

const MOCK_ARIA_LABEL = faker.lorem.words(2);
const MOCK_FIRST_VALUE = faker.string.uuid();
const MOCK_SECOND_VALUE = faker.string.uuid();
const MOCK_FIRST_LABEL = faker.lorem.words(2);
const MOCK_SECOND_LABEL = faker.lorem.words(2);
const MOCK_LABEL_ID = faker.string.alpha(8);
const MOCK_BADGE_ID = faker.string.alpha(8);
const MOCK_FIELD_LABEL = faker.lorem.word();
const MOCK_BADGE = faker.lorem.word();
const MOCK_PLACEHOLDER = faker.lorem.words(3);

const MOCK_OPTIONS = [
  { value: MOCK_FIRST_VALUE, label: MOCK_FIRST_LABEL },
  { value: MOCK_SECOND_VALUE, label: MOCK_SECOND_LABEL },
];

const setup = customRender(OptionSelect<string>, {
  aria: { label: MOCK_ARIA_LABEL },
  options: MOCK_OPTIONS,
  value: MOCK_FIRST_VALUE,
  onChange: vi.fn(),
});

describe(`<${OptionSelect.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  it.each([
    ['the selected option', {}, MOCK_FIRST_LABEL],
    [
      'the placeholder while no option is selected',
      { value: '', placeholder: MOCK_PLACEHOLDER },
      MOCK_PLACEHOLDER,
    ],
  ])(
    'names the trigger by its aria label and shows %s',
    (_, overrides, shownText) => {
      setup(overrides);

      const trigger = screen.getByRole('combobox', { name: MOCK_ARIA_LABEL });

      expect(trigger).toHaveTextContent(shownText);
    },
  );

  it('reports the option chosen from the list', async () => {
    const onChange = vi.fn();
    setup({ onChange });

    const trigger = screen.getByRole('combobox', { name: MOCK_ARIA_LABEL });
    await user.click(trigger);
    const option = await screen.findByRole('option', {
      name: MOCK_SECOND_LABEL,
    });
    await user.click(option);

    expect(onChange).toHaveBeenCalledWith(MOCK_SECOND_VALUE);
  });

  it('leaves the Tab order when disabled', async () => {
    setup({ isDisabled: true });

    await user.tab();
    const trigger = screen.getByRole('combobox', { name: MOCK_ARIA_LABEL });

    expect(trigger).not.toHaveFocus();
    expect(trigger).toBeDisabled();
  });

  describe('locked', () => {
    let onChange: Mock<(value: string) => void>;

    beforeEach(() => {
      onChange = vi.fn();
      renderWithIntl(
        <div>
          <span id={MOCK_LABEL_ID}>{MOCK_FIELD_LABEL}</span>
          <span id={MOCK_BADGE_ID}>{MOCK_BADGE}</span>
          <OptionSelect
            aria={{ labelledBy: MOCK_LABEL_ID, describedBy: MOCK_BADGE_ID }}
            options={MOCK_OPTIONS}
            value={MOCK_FIRST_VALUE}
            onChange={onChange}
            isLocked={true}
          />
        </div>,
      );
    });

    it('names the trigger by its label and value and describes it by the badge', () => {
      const trigger = screen.getByRole('combobox', {
        name: `${MOCK_FIELD_LABEL} ${MOCK_FIRST_LABEL}`,
      });

      expect(trigger).toHaveAccessibleDescription(MOCK_BADGE);
    });

    const expectClosedAndUnchanged = () => {
      const listbox = screen.queryByRole('listbox');

      expect(listbox).not.toBeInTheDocument();
      expect(onChange).not.toHaveBeenCalled();
    };

    it('does not open on click', async () => {
      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      expectClosedAndUnchanged();
    });

    describe('focused by Tab', () => {
      beforeEach(async () => {
        await user.tab();
      });

      it('stays in the Tab order and announces disabled', () => {
        const trigger = screen.getByRole('combobox');

        expect(trigger).toHaveFocus();
        expect(trigger).toHaveAttribute('aria-disabled', 'true');
        expect(trigger).toBeEnabled();
      });

      it.each(['{Enter}', KEY.SPACE, '{ArrowDown}', '{ArrowUp}'])(
        'does not open or change on %s',
        async (key) => {
          await user.keyboard(key);

          expectClosedAndUnchanged();
        },
      );
    });
  });
});
