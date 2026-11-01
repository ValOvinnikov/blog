import { Menu } from '@base-ui/react/menu';
import { ICONS } from '@blog/config';
import { faker } from '@faker-js/faker';
import {
  renderWithIntl,
  screen,
  waitFor,
} from '@platform/testing/custom-render';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { MenuRadioGroup, type TMenuRadioGroupProps } from './menu-radio-group';

faker.seed(6345);

const ARROW_DOWN = '{ArrowDown}';
const MENU_ITEM_RADIO = 'menuitemradio';
const MOCK_TRIGGER = faker.lorem.word();
const MOCK_LABEL = faker.lorem.word();
const MOCK_HINT = faker.lorem.sentence();
const MOCK_FIRST_VALUE = faker.string.uuid();
const MOCK_SECOND_VALUE = faker.string.uuid();
const MOCK_THIRD_VALUE = faker.string.uuid();
const MOCK_FIRST_LABEL = faker.lorem.words(2);
const MOCK_SECOND_LABEL = faker.lorem.words(2);
const MOCK_THIRD_LABEL = faker.lorem.words(2);

const MOCK_OPTIONS = [
  { value: MOCK_FIRST_VALUE, label: MOCK_FIRST_LABEL, icon: ICONS.GRID },
  { value: MOCK_SECOND_VALUE, label: MOCK_SECOND_LABEL, icon: ICONS.GLOBE },
  { value: MOCK_THIRD_VALUE, label: MOCK_THIRD_LABEL, icon: ICONS.CLOCK },
];

const InMenu = (props: TMenuRadioGroupProps<string>) => (
  <Menu.Root>
    <Menu.Trigger>{MOCK_TRIGGER}</Menu.Trigger>
    <Menu.Portal>
      <Menu.Positioner>
        <Menu.Popup>
          <MenuRadioGroup {...props} />
        </Menu.Popup>
      </Menu.Positioner>
    </Menu.Portal>
  </Menu.Root>
);

const DEFAULT_PROPS: TMenuRadioGroupProps<string> = {
  label: MOCK_LABEL,
  hint: MOCK_HINT,
  options: MOCK_OPTIONS,
  value: MOCK_FIRST_VALUE,
  onValueChange: vi.fn(),
};

const setup = (overrides?: Partial<TMenuRadioGroupProps<string>>) => {
  const props = { ...DEFAULT_PROPS, ...overrides };
  const view = renderWithIntl(<InMenu {...props} />);
  const rerenderWith = (next: Partial<TMenuRadioGroupProps<string>>) =>
    view.rerender(<InMenu {...props} {...next} />);

  return { rerenderWith };
};

const getItem = (name: string) => screen.getByRole(MENU_ITEM_RADIO, { name });

describe(`<${MenuRadioGroup.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  const openMenu = async () => {
    const trigger = screen.getByRole('button', { name: MOCK_TRIGGER });
    await user.click(trigger);
    return screen.findByRole('group', { name: MOCK_LABEL });
  };

  it('labels the group by its visible label and describes it by the hint', async () => {
    setup();

    const group = await openMenu();

    expect(group).toHaveAccessibleDescription(MOCK_HINT);
  });

  it('leaves the group undescribed without a hint', async () => {
    setup({ hint: undefined });

    const group = await openMenu();

    expect(group).not.toHaveAccessibleDescription();
  });

  it('checks only the item matching the value', async () => {
    setup({ value: MOCK_SECOND_VALUE });
    await openMenu();

    const firstItem = getItem(MOCK_FIRST_LABEL);
    const secondItem = getItem(MOCK_SECOND_LABEL);
    const thirdItem = getItem(MOCK_THIRD_LABEL);

    expect(secondItem).toBeChecked();
    expect(firstItem).not.toBeChecked();
    expect(thirdItem).not.toBeChecked();
  });

  it('moves the check when the value changes', async () => {
    const { rerenderWith } = setup();
    await openMenu();

    rerenderWith({ value: MOCK_THIRD_VALUE });
    const firstItem = getItem(MOCK_FIRST_LABEL);
    const thirdItem = getItem(MOCK_THIRD_LABEL);

    expect(thirdItem).toBeChecked();
    expect(firstItem).not.toBeChecked();
  });

  it('calls back with the chosen item value and keeps the menu open', async () => {
    const onValueChange = vi.fn();
    setup({ onValueChange });
    const group = await openMenu();

    const secondItem = getItem(MOCK_SECOND_LABEL);
    await user.click(secondItem);

    expect(onValueChange).toHaveBeenCalledExactlyOnceWith(MOCK_SECOND_VALUE);
    expect(group).toBeVisible();
  });

  it.each(['{Enter}', ' '])(
    'moves between items with arrow keys and chooses with %s',
    async (key) => {
      const onValueChange = vi.fn();
      setup({ onValueChange });
      const group = await openMenu();
      const firstItem = getItem(MOCK_FIRST_LABEL);
      const secondItem = getItem(MOCK_SECOND_LABEL);

      await user.keyboard(ARROW_DOWN);
      await waitFor(() => expect(firstItem).toHaveFocus());
      await user.keyboard(ARROW_DOWN);
      await waitFor(() => expect(secondItem).toHaveFocus());
      await user.keyboard(key);

      expect(onValueChange).toHaveBeenCalledExactlyOnceWith(MOCK_SECOND_VALUE);
      expect(group).toBeVisible();
    },
  );
});
