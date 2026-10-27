import { faker } from '@faker-js/faker';
import { customRender, screen } from '@platform/testing/custom-render';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { Switch } from './switch';

faker.seed(5995);

const MOCK_ARIA_LABEL = faker.lorem.words(2);
const MOCK_ON = faker.lorem.word();
const MOCK_OFF = faker.lorem.words(2);
const MOCK_CAPTION = faker.lorem.words(3);

const onCheckedChange = vi.fn();

const setup = customRender(Switch, {
  isChecked: false,
  onCheckedChange,
  ariaLabel: MOCK_ARIA_LABEL,
  labels: { caption: MOCK_CAPTION },
});

const reportedStates = () =>
  onCheckedChange.mock.calls.map(([checked]) => checked);

describe(`<${Switch.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  it('names the switch by its aria label, not by the visible state text', () => {
    setup({ isChecked: true, labels: { on: MOCK_ON, off: MOCK_OFF } });

    const toggle = screen.getByRole('switch', { name: MOCK_ARIA_LABEL });

    expect(toggle).toBeChecked();
  });

  it.each([
    {
      target: 'state text',
      isChecked: false,
      labels: { on: MOCK_ON, off: MOCK_OFF },
      text: MOCK_OFF,
      expected: true,
    },
    {
      target: 'caption',
      isChecked: true,
      labels: { caption: MOCK_CAPTION },
      text: MOCK_CAPTION,
      expected: false,
    },
  ])(
    'toggles when its $target is clicked',
    async ({ isChecked, labels, text, expected }) => {
      setup({ isChecked, labels });

      const label = screen.getByText(text);
      await user.click(label);

      expect(reportedStates()).toEqual([expected]);
    },
  );

  it('toggles once when the track itself is clicked', async () => {
    setup();

    const toggle = screen.getByRole('switch', { name: MOCK_ARIA_LABEL });
    await user.click(toggle);

    expect(reportedStates()).toEqual([true]);
  });

  it('ignores clicks on its caption while disabled', async () => {
    setup({ isDisabled: true });

    const caption = screen.getByText(MOCK_CAPTION);
    await user.click(caption);

    const toggle = screen.getByRole('switch', { name: MOCK_ARIA_LABEL });

    expect(onCheckedChange).not.toHaveBeenCalled();
    expect(toggle).toBeDisabled();
  });
});
