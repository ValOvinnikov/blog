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

  it('forwards a custom className', () => {
    setup({ className: 'text-accent', dataTestId: 'icon' });

    expect(screen.getByTestId('icon')).toHaveClass('text-accent');
  });

  it('renders a baked-in stroke-width per icon with no strokeWidth prop', () => {
    setup({ dataTestId: 'icon' });

    expect(screen.getByTestId('icon')).toHaveAttribute('stroke-width', '1.6');
  });

  it('defaults to aria-hidden when no aria-label is given', () => {
    setup({ dataTestId: 'icon' });

    expect(screen.getByTestId('icon')).toHaveAttribute('aria-hidden', 'true');
  });

  it('does not default aria-hidden when an aria-label is given', () => {
    setup({ 'aria-label': 'Share this post', dataTestId: 'icon' });

    const icon = screen.getByTestId('icon');
    expect(icon).toHaveAccessibleName('Share this post');
    expect(icon).not.toHaveAttribute('aria-hidden');
  });

  it('lets an explicit aria-hidden override the default even with an aria-label', () => {
    setup({
      'aria-label': 'Share this post',
      'aria-hidden': false,
      dataTestId: 'icon',
    });

    expect(screen.getByTestId('icon')).toHaveAttribute('aria-hidden', 'false');
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
