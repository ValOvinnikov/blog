import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { IconButton } from './icon-button';

describe(`<${IconButton.name}/>`, () => {
  it('renders as a button with aria-label', () => {
    render(
      <IconButton ariaLabel="Toggle theme">
        <span>icon</span>
      </IconButton>,
    );
    expect(screen.getByRole('button', { name: 'Toggle theme' })).toBeVisible();
  });

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn();
    render(
      <IconButton ariaLabel="click" onClick={onClick}>
        <span />
      </IconButton>,
    );
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
