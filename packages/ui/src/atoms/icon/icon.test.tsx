import { ICONS, type TIconName } from '@blog/config';
import { customRender, screen } from '@blog/ui/testing/custom-render';

import { Icon } from './icon';
import { ICON_REGISTRY } from './icon-registry';

const setup = customRender(Icon, { name: ICONS.SUN });

describe(`<${Icon.name}/>`, () => {
  it('renders the SVG registered for the given name', () => {
    setup({ name: ICONS.SUN, dataTestId: 'sun-icon' });
    setup({ name: ICONS.MOON, dataTestId: 'moon-icon' });

    expect(
      screen.getByTestId('sun-icon').querySelectorAll('line'),
    ).toHaveLength(8);
    expect(
      screen.getByTestId('moon-icon').querySelectorAll('line'),
    ).toHaveLength(0);
  });

  it('defaults to a 24x24 size', () => {
    setup({ dataTestId: 'icon' });

    expect(screen.getByTestId('icon')).toHaveAttribute('width', '24');
    expect(screen.getByTestId('icon')).toHaveAttribute('height', '24');
  });

  it('forwards size as width and height', () => {
    setup({ size: 32, dataTestId: 'icon' });

    expect(screen.getByTestId('icon')).toHaveAttribute('width', '32');
    expect(screen.getByTestId('icon')).toHaveAttribute('height', '32');
  });

  it('forwards strokeWidth', () => {
    setup({ strokeWidth: 2.5, dataTestId: 'icon' });

    expect(screen.getByTestId('icon')).toHaveAttribute('stroke-width', '2.5');
  });

  it('forwards a custom className', () => {
    setup({ className: 'text-accent', dataTestId: 'icon' });

    expect(screen.getByTestId('icon')).toHaveClass('text-accent');
  });

  it('forwards aria-hidden and other svg attributes', () => {
    setup({ 'aria-hidden': true, dataTestId: 'icon' });

    expect(screen.getByTestId('icon')).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('ICON_REGISTRY', () => {
  it('has a registry entry with a component and url for every ICONS value', () => {
    const names = Object.values(ICONS) as TIconName[];

    names.forEach((name) => {
      expect(ICON_REGISTRY[name]).toBeDefined();
      expect(ICON_REGISTRY[name].component).toBeDefined();
      expect(ICON_REGISTRY[name].url.length).toBeGreaterThan(0);
    });
  });
});
