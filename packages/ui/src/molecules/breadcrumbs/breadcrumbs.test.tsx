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

  it('renders the first item as a link with a decorative House icon, keeping the label as its accessible name', () => {
    setup();
    const homeLink = screen.getByRole('link', { name: firstItem.label });
    const icon = homeLink.querySelector('svg');
    const labelText = screen.getByText(firstItem.label);

    expect(icon).toHaveAttribute('aria-hidden', 'true');
    expect(labelText).toHaveClass('sr-only');
  });

  it('sets a title attribute on the first item for sighted hover users', () => {
    setup();
    expect(screen.getByRole('link', { name: firstItem.label })).toHaveAttribute(
      'title',
      firstItem.label,
    );
  });

  it('sets a title attribute on the first item even when it is also the current page', () => {
    const { container } = setup({ items: [firstItem] });
    const current = container.querySelector('[aria-current="page"]');

    expect(current).toHaveAttribute('title', firstItem.label);
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

  it('does not apply its own vertical margin on the root nav', () => {
    setup();
    expect(screen.getByRole('navigation')).not.toHaveClass('my-4');
  });

  it('renders the House icon at Size.SM, not the default Size.MD', () => {
    setup();
    const homeLink = screen.getByRole('link', { name: firstItem.label });
    const icon = homeLink.querySelector('svg');

    expect(icon).toHaveClass('size-4');
    expect(icon).not.toHaveClass('size-4.5');
  });
});
