import { ICONS } from '@blog/config';
import { faker } from '@faker-js/faker';
import { customRender, screen } from '@platform/testing/custom-render';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { IconSoloToggle } from './icon-solo-toggle';

faker.seed(6382);

const MOCK_LABEL = faker.lorem.words(2);

const setup = customRender(IconSoloToggle, {
  ariaLabel: MOCK_LABEL,
  tooltip: faker.lorem.words(3),
  icon: ICONS.SUN,
  isPressed: false,
  onPressedChange: vi.fn(),
});

describe(`<${IconSoloToggle.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  it('shows the pressed state it is given', () => {
    setup({ isPressed: true });

    const toggle = screen.getByRole('button', { name: MOCK_LABEL });

    expect(toggle).toBePressed();
  });

  it('reports the next pressed state when clicked', async () => {
    const onPressedChange = vi.fn();
    setup({ onPressedChange });

    const toggle = screen.getByRole('button', { name: MOCK_LABEL });
    await user.click(toggle);

    const [isPressed] = onPressedChange.mock.calls.flat();

    expect(isPressed).toBe(true);
  });

  it('is its own Tab stop outside a toolbar', async () => {
    setup();

    await user.tab();
    const toggle = screen.getByRole('button', { name: MOCK_LABEL });

    expect(toggle).toHaveFocus();
  });
});
