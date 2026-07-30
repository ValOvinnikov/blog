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

  it('never wraps the trail onto multiple lines', () => {
    setup();
    const list = screen.getByRole('list');
    expect(list).toHaveClass('flex-nowrap');
    expect(list).not.toHaveClass('flex-wrap');
  });

  it('keeps every item before the last from shrinking, so only the last one truncates', () => {
    setup();
    const listItems = screen.getAllByRole('listitem');
    for (const item of listItems.slice(0, -1)) {
      expect(item).toHaveClass('shrink-0');
    }
    const lastListItem = listItems[listItems.length - 1];
    expect(lastListItem).toHaveClass('min-w-0');
    expect(lastListItem).toHaveClass('flex-1');
  });

  it('marks the last item as truncatable text', () => {
    setup();
    expect(screen.getByText(lastItem.label)).toHaveClass('truncate');
  });

  it('sets a title attribute on the last item so its full text is available on hover', () => {
    setup();
    expect(screen.getByText(lastItem.label)).toHaveAttribute(
      'title',
      lastItem.label,
    );
  });

  it('keeps the full untruncated text of the last item in the DOM for assistive tech', () => {
    setup();
    expect(screen.getByText(lastItem.label)).toBeInTheDocument();
  });
});
