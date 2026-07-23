import {
  customRender,
  renderElement,
  screen,
} from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';
import type { AnchorHTMLAttributes } from 'react';

import { CommandLink } from './command-link';

faker.seed(123);

const setup = customRender(CommandLink, {
  href: '/',
  command: 'cd ~',
  ariaLabel: 'Return home',
});

describe(`<${CommandLink.name}/>`, () => {
  it('renders an anchor with the given href', () => {
    setup();
    expect(screen.getByRole('link', { name: 'Return home' })).toHaveAttribute(
      'href',
      '/',
    );
  });

  it('uses ariaLabel as the accessible name, not the visible command', () => {
    const command = faker.hacker.phrase();
    setup({ command });
    expect(screen.getByRole('link', { name: 'Return home' })).toBeVisible();
    expect(
      screen.queryByRole('link', { name: command }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(command)).toBeVisible();
  });

  it('ignores a raw aria-label prop in favor of ariaLabel', () => {
    setup({ 'aria-label': 'Wrong label' });
    expect(screen.getByRole('link', { name: 'Return home' })).toBeVisible();
    expect(
      screen.queryByRole('link', { name: 'Wrong label' }),
    ).not.toBeInTheDocument();
  });

  it('marks the prompt and arrow as decorative', () => {
    setup();
    expect(screen.getByText('$')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('→')).toHaveAttribute('aria-hidden', 'true');
  });

  it('marks the cursor as decorative when shown', () => {
    setup({ showCursor: true });
    expect(screen.getByTestId('cursor')).toHaveAttribute('aria-hidden', 'true');
  });

  it('omits the arrow when showArrow is false', () => {
    setup({ showArrow: false });
    expect(screen.queryByText('→')).not.toBeInTheDocument();
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
      <CommandLink
        as={CustomLink}
        href="/about"
        command="cd ~/about"
        ariaLabel="About"
      />,
    );

    const link = screen.getByRole('link', { name: 'About' });
    expect(link).toHaveAttribute('data-custom-link', 'true');
    expect(link).toHaveAttribute('href', '/about');
  });

  it('forwards data-testid', () => {
    setup({ dataTestId: 'command-link' });
    expect(screen.getByTestId('command-link')).toBeVisible();
  });

  it('merges extra className', () => {
    setup({ className: 'ml-2' });
    expect(
      screen.getByRole('link', { name: 'Return home' }).className,
    ).toContain('ml-2');
  });
});
