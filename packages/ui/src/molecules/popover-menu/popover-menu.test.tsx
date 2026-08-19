import { renderElement, screen } from '@blog/ui/testing/custom-render';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';

import { PopoverMenu } from './popover-menu';

describe(`<${PopoverMenu.name}/>`, () => {
  it('renders a trigger with the correct menu-button ARIA attributes', () => {
    renderElement(
      <PopoverMenu>
        <PopoverMenu.Trigger ariaLabel="Open menu" isOpen={false} panelId="p1">
          Trigger
        </PopoverMenu.Trigger>
        <PopoverMenu.Panel id="p1" isOpen={false}>
          <PopoverMenu.Item>Item one</PopoverMenu.Item>
        </PopoverMenu.Panel>
      </PopoverMenu>,
    );

    const trigger = screen.getByRole('button', { name: 'Open menu' });
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveAttribute('aria-controls', 'p1');
  });

  it('forwards a ref on the trigger to the underlying button', () => {
    const ref = createRef<HTMLButtonElement>();
    renderElement(
      <PopoverMenu>
        <PopoverMenu.Trigger
          ariaLabel="Open menu"
          isOpen={false}
          panelId="p1"
          ref={ref}
        >
          Trigger
        </PopoverMenu.Trigger>
        <PopoverMenu.Panel id="p1" isOpen={false}>
          <PopoverMenu.Item>Item one</PopoverMenu.Item>
        </PopoverMenu.Panel>
      </PopoverMenu>,
    );

    expect(ref.current).toBe(screen.getByRole('button', { name: 'Open menu' }));
  });

  it('hides the panel when isOpen is false and shows it when isOpen is true', () => {
    const { rerender } = renderElement(
      <PopoverMenu>
        <PopoverMenu.Trigger ariaLabel="Open menu" isOpen={false} panelId="p1">
          Trigger
        </PopoverMenu.Trigger>
        <PopoverMenu.Panel id="p1" isOpen={false}>
          <PopoverMenu.Item>Item one</PopoverMenu.Item>
        </PopoverMenu.Panel>
      </PopoverMenu>,
    );

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    rerender(
      <PopoverMenu>
        <PopoverMenu.Trigger ariaLabel="Open menu" isOpen={true} panelId="p1">
          Trigger
        </PopoverMenu.Trigger>
        <PopoverMenu.Panel id="p1" isOpen={true}>
          <PopoverMenu.Item>Item one</PopoverMenu.Item>
        </PopoverMenu.Panel>
      </PopoverMenu>,
    );

    expect(screen.getByRole('menu')).toBeVisible();
  });

  it('renders each Item with role="menuitem"', () => {
    renderElement(
      <PopoverMenu>
        <PopoverMenu.Trigger ariaLabel="Open menu" isOpen={true} panelId="p1">
          Trigger
        </PopoverMenu.Trigger>
        <PopoverMenu.Panel id="p1" isOpen={true}>
          <PopoverMenu.Item>Item one</PopoverMenu.Item>
          <PopoverMenu.Item as="a" href="https://example.com">
            Item two
          </PopoverMenu.Item>
        </PopoverMenu.Panel>
      </PopoverMenu>,
    );

    expect(screen.getAllByRole('menuitem')).toHaveLength(2);
    expect(screen.getByRole('menuitem', { name: 'Item two' })).toHaveAttribute(
      'href',
      'https://example.com',
    );
  });

  it('calls onClick when a button Item is clicked', async () => {
    const onClick = vi.fn();
    renderElement(
      <PopoverMenu>
        <PopoverMenu.Trigger ariaLabel="Open menu" isOpen={true} panelId="p1">
          Trigger
        </PopoverMenu.Trigger>
        <PopoverMenu.Panel id="p1" isOpen={true}>
          <PopoverMenu.Item onClick={onClick}>Item one</PopoverMenu.Item>
        </PopoverMenu.Panel>
      </PopoverMenu>,
    );

    await userEvent.click(screen.getByRole('menuitem', { name: 'Item one' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('renders a Separator between Items with role="separator"', () => {
    renderElement(
      <PopoverMenu>
        <PopoverMenu.Trigger ariaLabel="Open menu" isOpen={true} panelId="p1">
          Trigger
        </PopoverMenu.Trigger>
        <PopoverMenu.Panel id="p1" isOpen={true}>
          <PopoverMenu.Item>Copy link</PopoverMenu.Item>
          <PopoverMenu.Separator />
          <PopoverMenu.Item as="a" href="https://example.com">
            Share on X
          </PopoverMenu.Item>
        </PopoverMenu.Panel>
      </PopoverMenu>,
    );

    expect(screen.getByRole('separator')).toBeVisible();
  });

  it('forwards data-testid', () => {
    renderElement(
      <PopoverMenu dataTestId="popover-menu">
        <PopoverMenu.Trigger ariaLabel="Open menu" isOpen={true} panelId="p1">
          Trigger
        </PopoverMenu.Trigger>
        <PopoverMenu.Panel id="p1" isOpen={true}>
          <PopoverMenu.Item>Item one</PopoverMenu.Item>
        </PopoverMenu.Panel>
      </PopoverMenu>,
    );

    expect(screen.getByTestId('popover-menu')).toBeVisible();
  });

  it('merges extra className', () => {
    renderElement(
      <PopoverMenu className="mt-4" dataTestId="popover-menu">
        <PopoverMenu.Trigger ariaLabel="Open menu" isOpen={true} panelId="p1">
          Trigger
        </PopoverMenu.Trigger>
        <PopoverMenu.Panel id="p1" isOpen={true}>
          <PopoverMenu.Item>Item one</PopoverMenu.Item>
        </PopoverMenu.Panel>
      </PopoverMenu>,
    );

    expect(screen.getByTestId('popover-menu').className).toContain('mt-4');
  });
});
