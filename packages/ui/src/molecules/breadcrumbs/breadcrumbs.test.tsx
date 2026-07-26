import { customRender, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';
import type { ReactNode } from 'react';

import { Breadcrumbs } from './breadcrumbs';

faker.seed(123);

const firstItem = { label: 'Home', href: '/' };
const middleItem = {
  label: faker.commerce.department(),
  href: `/category/${faker.lorem.slug()}`,
};
const lastItem = {
  label: faker.lorem.sentence(4),
  href: `/blog/${faker.lorem.slug()}`,
};
const items = [firstItem, middleItem, lastItem];
const ariaLabel = 'Breadcrumb';

const setup = customRender(Breadcrumbs, { items, ariaLabel });

describe(`<${Breadcrumbs.name}/>`, () => {
  it('renders a nav landmark with the passed ariaLabel', () => {
    setup();
    expect(screen.getByRole('navigation', { name: ariaLabel })).toBeVisible();
  });

  it('renders every item except the last as a link with the correct label and href', () => {
    setup();
    for (const item of items.slice(0, -1)) {
      expect(screen.getByRole('link', { name: item.label })).toHaveAttribute(
        'href',
        item.href,
      );
    }
  });

  it('renders the last item as text with aria-current="page", not a link', () => {
    setup();
    const current = screen.getByText(lastItem.label);
    expect(current).toHaveAttribute('aria-current', 'page');
    expect(
      screen.queryByRole('link', { name: lastItem.label }),
    ).not.toBeInTheDocument();
  });

  it('preserves trail order', () => {
    setup();
    const rendered = screen
      .getAllByRole('listitem')
      .map((li) => li.textContent);
    expect(rendered).toEqual(items.map((item) => item.label));
  });

  it('renders links via the linkAs component when provided', () => {
    const CustomLink = ({
      href,
      children,
    }: {
      href: string;
      children?: ReactNode;
    }) => (
      <a href={href} data-custom-link="true">
        {children}
      </a>
    );
    setup({ linkAs: CustomLink });
    const firstLink = screen.getByRole('link', { name: firstItem.label });
    expect(firstLink).toHaveAttribute('data-custom-link', 'true');
  });

  it('forwards dataTestId to the nav element', () => {
    setup({ dataTestId: 'breadcrumbs' });
    expect(screen.getByTestId('breadcrumbs')).toBeVisible();
  });

  it('accepts a className override on the root nav', () => {
    setup({ className: 'custom-class' });
    expect(screen.getByRole('navigation')).toHaveClass('custom-class');
  });
});
