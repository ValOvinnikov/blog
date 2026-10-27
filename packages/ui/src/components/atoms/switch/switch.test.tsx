import { customRender, screen } from '@blog/ui/testing/custom-render';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import type { Mock } from 'vitest';

import { Switch } from './switch';

const setup = customRender(Switch, {
  isChecked: false,
  onChange: vi.fn(),
});

describe(`<${Switch.name}/>`, () => {
  let user: UserEvent;
  let onChange: Mock<(checked: boolean) => void>;

  beforeEach(() => {
    user = userEvent.setup();
    onChange = vi.fn();
  });

  it('renders an unchecked switch', () => {
    setup();

    const control = screen.getByRole('switch');

    expect(control).not.toBeChecked();
  });

  it('renders a checked switch', () => {
    setup({ isChecked: true });

    const control = screen.getByRole('switch');

    expect(control).toBeChecked();
  });

  it('calls onChange with the next value when clicked', async () => {
    setup({ onChange });

    const control = screen.getByRole('switch');
    await user.click(control);

    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('calls onChange when activated by keyboard', async () => {
    setup({ onChange });

    await user.tab();
    await user.keyboard(' ');

    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('renders a locked switch as checked and disabled', () => {
    setup({ isChecked: true, isLocked: true });

    const control = screen.getByRole('switch');

    expect(control).toBeChecked();
    expect(control).toBeDisabled();
  });

  it('does not call onChange when a locked switch is clicked', async () => {
    setup({ isChecked: true, isLocked: true, onChange });

    const control = screen.getByRole('switch');
    await user.click(control);

    expect(onChange).not.toHaveBeenCalled();
  });
});
