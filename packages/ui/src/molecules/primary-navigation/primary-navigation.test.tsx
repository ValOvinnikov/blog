import { faker } from '@faker-js/faker';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

import { PrimaryNavigation } from './primary-navigation';

faker.seed(123);

const links = faker.helpers.multiple(
  () => ({
    href: `/${faker.lorem.slug()}`,
    label: faker.lorem.words(2),
  }),
  { count: 3 },
);

describe(`<${PrimaryNavigation.name}/>`, () => {
  it('renders all nav links', () => {
    render(<PrimaryNavigation links={links} />);
    for (const link of links) {
      expect(screen.getByRole('link', { name: link.label })).toBeVisible();
    }
  });

  it('renders as a nav landmark', () => {
    render(<PrimaryNavigation links={links} />);
    expect(screen.getByRole('navigation')).toBeVisible();
  });

  it('renders the actions slot when provided', () => {
    render(
      <PrimaryNavigation links={links} actions={<button>Toggle</button>} />,
    );
    expect(screen.getByRole('button', { name: 'Toggle' })).toBeVisible();
  });

  it('renders without actions when omitted', () => {
    render(<PrimaryNavigation links={links} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders each link via linkAs when provided', () => {
    const CustomLink = ({
      href,
      children,
    }: {
      href: string;
      children?: ReactNode;
    }) => (
      <a href={href} data-testid="custom-link">
        {children}
      </a>
    );

    render(<PrimaryNavigation links={links} linkAs={CustomLink} />);
    expect(screen.getAllByTestId('custom-link')).toHaveLength(links.length);
  });
});
