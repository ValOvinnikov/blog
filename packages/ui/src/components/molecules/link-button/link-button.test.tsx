import {
  customRender,
  renderElement,
  screen,
} from '@blog/ui/testing/custom-render';
import type { AnchorHTMLAttributes } from 'react';

import { LinkButton } from './link-button';

const setup = customRender(LinkButton, {
  href: '/blog',
  children: 'Read more',
});

describe(`<${LinkButton.name}/>`, () => {
  it('renders an anchor by default', () => {
    setup();

    expect(screen.getByRole('link', { name: 'Read more' })).toHaveAttribute(
      'href',
      '/blog',
    );
  });

  it('supports custom link components through as', () => {
    const CustomLink = ({
      href,
      ...rest
    }: AnchorHTMLAttributes<HTMLAnchorElement>) => (
      <a data-custom-link="true" href={href} {...rest} />
    );

    renderElement(
      <LinkButton as={CustomLink} href="/about">
        About
      </LinkButton>,
    );

    expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute(
      'data-custom-link',
      'true',
    );
  });

  it('forwards data-testid', () => {
    setup({ dataTestId: 'blog-link', children: 'Blog' });

    expect(screen.getByTestId('blog-link')).toBeVisible();
  });
});
