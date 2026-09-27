import { customRender, screen } from '@blog/ui/testing/custom-render';
import userEvent from '@testing-library/user-event';

import { Switch } from './switch';

const setup = customRender(Switch, {
  isChecked: false,
  onChange: vi.fn(),
});

describe(`<${Switch.name}/>`, () => {
  it('renders an unchecked switch', () => {
    setup();
    expect(screen.getByRole('switch')).not.toBeChecked();
  });

  it('renders a checked switch', () => {
    setup({ isChecked: true });
    expect(screen.getByRole('switch')).toBeChecked();
  });

  it('calls onChange with the next value when clicked', async () => {
    const onChange = vi.fn();
    setup({ onChange });
    await userEvent.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('calls onChange when activated by keyboard', async () => {
    const onChange = vi.fn();
    setup({ onChange });
    screen.getByRole('switch').focus();
    await userEvent.keyboard(' ');
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('renders a locked switch as checked and disabled', () => {
    setup({ isChecked: true, isLocked: true });
    const control = screen.getByRole('switch');
    expect(control).toBeChecked();
    expect(control).toBeDisabled();
  });

  it('does not call onChange when a locked switch is clicked', async () => {
    const onChange = vi.fn();
    setup({ isChecked: true, isLocked: true, onChange });
    await userEvent.click(screen.getByRole('switch'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('forwards dataTestId to the input', () => {
    setup({ dataTestId: 'consent-switch' });
    expect(screen.getByTestId('consent-switch')).toBeVisible();
  });
});
