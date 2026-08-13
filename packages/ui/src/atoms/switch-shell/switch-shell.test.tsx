import {
  customRender,
  renderElement,
  screen,
} from '@blog/ui/testing/custom-render';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';

import { SwitchShell } from './switch-shell';

const setup = customRender(SwitchShell, {});

describe(`<${SwitchShell.name}/>`, () => {
  it('renders a button', () => {
    setup();
    expect(screen.getByRole('button')).toBeVisible();
  });

  it('renders a thumb element', () => {
    setup();
    expect(screen.getByTestId('switch-shell-thumb')).toBeVisible();
  });

  it('forwards data attributes a headless behavior library merges in (e.g. data-checked) to the root element', () => {
    renderElement(<SwitchShell aria-checked="true" data-checked="" />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-checked', 'true');
    expect(button).toHaveAttribute('data-checked', '');
  });

  it('forwards event handlers to the root element', async () => {
    const onClick = vi.fn();
    setup({ onClick });
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('forwards a ref to the underlying button', () => {
    const ref = createRef<HTMLButtonElement>();
    setup({ ref });
    expect(ref.current).toBe(screen.getByRole('button'));
  });

  it('forwards dataTestId to the root element', () => {
    setup({ dataTestId: 'switch-shell' });
    expect(screen.getByTestId('switch-shell')).toBeVisible();
  });

  it('accepts a className override on the root', () => {
    setup({ className: 'custom-class' });
    expect(screen.getByRole('button')).toHaveClass('custom-class');
  });
});
