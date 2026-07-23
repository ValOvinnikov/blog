import { customRender, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';
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

const setup = customRender(PrimaryNavigation, {
  links,
});

describe(`<${PrimaryNavigation.name}/>`, () => {
  it('renders all nav links', () => {
    setup();
    for (const link of links) {
      expect(screen.getByRole('link', { name: link.label })).toBeVisible();
    }
  });

  it('renders as a nav landmark', () => {
    setup();
    expect(screen.getByRole('navigation')).toBeVisible();
  });

  it('renders the actions slot when provided', () => {
    setup({ actions: <button>Toggle</button> });
    expect(screen.getByRole('button', { name: 'Toggle' })).toBeVisible();
  });

  it('renders without actions when omitted', () => {
    setup();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('forwards target to the anchor when provided on a link', () => {
    const externalHref = faker.internet.url();
    const externalLabel = faker.lorem.words(2);

    setup({
      links: [
        ...links,
        { href: externalHref, label: externalLabel, target: '_blank' },
      ],
    });

    expect(screen.getByRole('link', { name: externalLabel })).toHaveAttribute(
      'target',
      '_blank',
    );
    for (const link of links) {
      expect(
        screen.getByRole('link', { name: link.label }),
      ).not.toHaveAttribute('target');
    }
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

    setup({ linkAs: CustomLink });
    expect(screen.getAllByTestId('custom-link')).toHaveLength(links.length);
  });
});
