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

  describe('when unlocked', () => {
    beforeEach(() => {
      setup({ onChange });
    });

    it('calls onChange with the next value when clicked', async () => {
      const control = screen.getByRole('switch');
      await user.click(control);

      expect(onChange).toHaveBeenCalledWith(true);
    });

    it('calls onChange when activated by keyboard', async () => {
      await user.tab();
      await user.keyboard(' ');

      expect(onChange).toHaveBeenCalledWith(true);
    });
  });

  describe('when locked', () => {
    let control: HTMLElement;

    beforeEach(() => {
      setup({ isChecked: true, isLocked: true, onChange });
      control = screen.getByRole('switch');
    });

    it('stays checked and aria-disabled', () => {
      expect(control).toBeChecked();
      expect(control).toBeEnabled();
      expect(control).toHaveAttribute('aria-disabled', 'true');
    });

    it('does not call onChange when clicked', async () => {
      await user.click(control);

      expect(onChange).not.toHaveBeenCalled();
      expect(control).toBeChecked();
    });

    it('is reached by Tab and ignores Space', async () => {
      await user.tab();
      await user.keyboard(' ');

      expect(control).toHaveFocus();
      expect(control).toBeChecked();
      expect(onChange).not.toHaveBeenCalled();
    });
  });
});
