import { render, screen } from '@testing-library/react';

import { Sidebar } from './sidebar';

describe(Sidebar, () => {
  it('renders each section label and its nav links', () => {
    render(
      <Sidebar
        sections={[
          {
            label: 'Platform',
            items: [{ label: 'Tenants', href: '/tenants' }],
          },
        ]}
      />,
    );

    expect(screen.getByText('Platform')).toBeVisible();
    expect(screen.getByRole('link', { name: 'Tenants' })).toHaveAttribute(
      'href',
      '/tenants',
    );
  });

  it('renders the note instead of a dead link when a section has no items yet', () => {
    render(
      <Sidebar
        sections={[
          {
            label: 'Tenant · acme',
            items: [],
            note: 'Look and Voice ship soon.',
          },
        ]}
      />,
    );

    expect(screen.getByText('Look and Voice ship soon.')).toBeVisible();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('renders the switcher slot when provided', () => {
    render(<Sidebar sections={[]} switcher={<div>Tenant switcher</div>} />);

    expect(screen.getByText('Tenant switcher')).toBeVisible();
  });
});
