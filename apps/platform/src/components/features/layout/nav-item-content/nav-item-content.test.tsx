import { ICONS } from '@blog/config';
import { render, screen } from '@platform/testing/custom-render';

import { NavItemContent } from './nav-item-content';

describe(NavItemContent, () => {
  it('renders the icon and label', () => {
    const { container } = render(
      <NavItemContent icon={ICONS.GRID} label="Tenants" />,
    );

    expect(screen.getByText('Tenants')).toBeVisible();
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('renders a disabled reason only when given one', () => {
    const { rerender } = render(
      <NavItemContent icon={ICONS.GRID} label="Domain" />,
    );
    expect(screen.queryByText('Coming soon')).not.toBeInTheDocument();

    rerender(
      <NavItemContent
        icon={ICONS.GRID}
        label="Domain"
        disabledReason="Coming soon"
      />,
    );
    expect(screen.getByText('Coming soon')).toBeVisible();
  });

  it('renders no badge when none is given', () => {
    const { container } = render(
      <NavItemContent icon={ICONS.GRID} label="Tenants" />,
    );
    expect(container.querySelector('span[aria-hidden="true"]')).toBeNull();
  });

  it('renders the badge label and tone dot by default', () => {
    const { container } = render(
      <NavItemContent
        icon={ICONS.GRID}
        label="Tenants"
        badge={{ label: 'this milestone', tone: 'neutral' }}
      />,
    );

    expect(screen.getByText('this milestone')).toBeVisible();
    expect(container.querySelector('span[aria-hidden="true"]')).not.toBeNull();
  });

  it('omits the tone dot when the badge sets hasDot to false', () => {
    const { container } = render(
      <NavItemContent
        icon={ICONS.GRID}
        label="Platform"
        badge={{ label: 'platform', tone: 'neutral', hasDot: false }}
      />,
    );

    expect(screen.getByText('platform')).toBeVisible();
    expect(container.querySelector('span[aria-hidden="true"]')).toBeNull();
  });
});
