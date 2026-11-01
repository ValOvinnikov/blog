import { ICONS } from '@blog/config';
import { faker } from '@faker-js/faker';
import { customRender, screen } from '@platform/testing/custom-render';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { IconSoloButton } from './icon-solo-button';

faker.seed(6382);

const ARIA_PRESSED = 'aria-pressed';
const MOCK_LABEL = faker.lorem.words(2);
const MOCK_TOOLTIP = faker.lorem.words(3);

const setup = customRender(IconSoloButton, {
  ariaLabel: MOCK_LABEL,
  tooltip: MOCK_TOOLTIP,
  icon: ICONS.SUN,
  onClick: vi.fn(),
});

describe(`<${IconSoloButton.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  it('has no pressed state', () => {
    setup();

    const button = screen.getByRole('button', { name: MOCK_LABEL });

    expect(button).not.toHaveAttribute(ARIA_PRESSED);
  });

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn();
    setup({ onClick });

    const button = screen.getByRole('button', { name: MOCK_LABEL });
    await user.click(button);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('is its own Tab stop outside a toolbar', async () => {
    setup();

    await user.tab();
    const button = screen.getByRole('button', { name: MOCK_LABEL });

    expect(button).toHaveFocus();
  });

  it('opens its tooltip at once on keyboard focus, keeping the name', async () => {
    setup();

    await user.tab();
    const tooltip = await screen.findByText(MOCK_TOOLTIP);
    const button = screen.getByRole('button', { name: MOCK_LABEL });

    expect(tooltip).toBeVisible();
    expect(button).toHaveAccessibleName(MOCK_LABEL);
  });
});
