import {
  customRender,
  renderElement,
  screen,
} from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';
import type { AnchorHTMLAttributes } from 'react';

import { ProseLink } from './prose-link';

faker.seed(123);

const setup = customRender(ProseLink, {
  href: '/about',
  children: 'About',
});

describe(`<${ProseLink.name}/>`, () => {
  it('renders an anchor with the given href and children', () => {
    const label = faker.lorem.words(3);
    setup({ children: label });
    expect(screen.getByRole('link', { name: label })).toHaveAttribute(
      'href',
      '/about',
    );
  });

  it('applies the accent/underline treatment', () => {
    setup();
    expect(screen.getByRole('link', { name: 'About' }).className).toContain(
      'text-accent',
    );
  });

  it('does not set an explicit font-size class, inheriting the surrounding text', () => {
    setup();
    expect(screen.getByRole('link', { name: 'About' }).className).not.toMatch(
      /text-(xs|sm|base|lg|xl|copy|meta|label)\b/,
    );
  });

  it('renders with a custom component when the as prop is provided', () => {
    const CustomLink = ({
      href,
      children,
      ...rest
    }: AnchorHTMLAttributes<HTMLAnchorElement>) => (
      <a href={href} data-custom-link="true" {...rest}>
        {children}
      </a>
    );

    renderElement(
      <ProseLink as={CustomLink} href="/about">
        About
      </ProseLink>,
    );

    const link = screen.getByRole('link', { name: 'About' });
    expect(link).toHaveAttribute('data-custom-link', 'true');
    expect(link).toHaveAttribute('href', '/about');
  });

  it('forwards data-testid', () => {
    setup({ dataTestId: 'prose-link' });
    expect(screen.getByTestId('prose-link')).toBeVisible();
  });

  it('merges extra className', () => {
    setup({ className: 'ml-2' });
    expect(screen.getByRole('link', { name: 'About' }).className).toContain(
      'ml-2',
    );
  });
});
