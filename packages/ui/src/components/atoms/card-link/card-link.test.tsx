import { customRender, screen } from '@blog/ui/testing/custom-render';
import type { ReactNode } from 'react';

import { CardLink } from './card-link';

const setup = customRender(CardLink, {
  href: '/posts/hello-world',
  children: 'Hello World',
});

describe(`<${CardLink.name}/>`, () => {
  it('renders a link to href named by its children', () => {
    setup();
    expect(screen.getByRole('link', { name: 'Hello World' })).toHaveAttribute(
      'href',
      '/posts/hello-world',
    );
  });

  it('names the link by ariaLabel when given', () => {
    setup({ ariaLabel: 'Read Hello World' });
    expect(
      screen.getByRole('link', { name: 'Read Hello World' }),
    ).toBeVisible();
  });

  it('opens in a new tab when target is _blank', () => {
    setup({ target: '_blank' });
    expect(screen.getByRole('link')).toHaveAttribute('target', '_blank');
  });

  it('renders through the linkAs component', () => {
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
    expect(screen.getByTestId('custom-link')).toHaveAttribute(
      'href',
      '/posts/hello-world',
    );
  });
});
