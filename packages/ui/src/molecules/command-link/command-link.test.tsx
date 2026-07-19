import { faker } from '@faker-js/faker';
import { render, screen } from '@testing-library/react';
import type { AnchorHTMLAttributes } from 'react';

import { CommandLink } from './command-link';

faker.seed(123);

describe(`<${CommandLink.name}/>`, () => {
  it('renders an anchor with the given href', () => {
    render(<CommandLink href="/" command="cd ~" ariaLabel="Return home" />);
    expect(screen.getByRole('link', { name: 'Return home' })).toHaveAttribute(
      'href',
      '/',
    );
  });

  it('uses ariaLabel as the accessible name, not the visible command', () => {
    const command = faker.hacker.phrase();
    render(<CommandLink href="/" command={command} ariaLabel="Return home" />);
    expect(screen.getByRole('link', { name: 'Return home' })).toBeVisible();
    expect(
      screen.queryByRole('link', { name: command }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(command)).toBeVisible();
  });

  it('ignores a raw aria-label prop in favor of ariaLabel', () => {
    render(
      <CommandLink
        href="/"
        command="cd ~"
        ariaLabel="Return home"
        aria-label="Wrong label"
      />,
    );
    expect(screen.getByRole('link', { name: 'Return home' })).toBeVisible();
    expect(
      screen.queryByRole('link', { name: 'Wrong label' }),
    ).not.toBeInTheDocument();
  });

  it('marks the prompt and arrow as decorative', () => {
    render(<CommandLink href="/" command="cd ~" ariaLabel="Return home" />);
    expect(screen.getByText('$')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('→')).toHaveAttribute('aria-hidden', 'true');
  });

  it('marks the cursor as decorative when shown', () => {
    const { container } = render(
      <CommandLink
        href="/"
        command="cd ~"
        ariaLabel="Return home"
        showCursor
      />,
    );
    // The cursor is an empty, roleless span — no semantic query reaches it,
    // so a scoped container query is the documented Testing Library
    // escape hatch, disambiguated from the prompt/arrow via `:empty`.
    expect(
      container.querySelector('[aria-hidden="true"]:empty'),
    ).toHaveAttribute('aria-hidden', 'true');
  });

  it('omits the arrow when showArrow is false', () => {
    render(
      <CommandLink
        href="/"
        command="cd ~"
        ariaLabel="Return home"
        showArrow={false}
      />,
    );
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

    render(
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
    render(
      <CommandLink
        href="/"
        command="cd ~"
        ariaLabel="Return home"
        dataTestId="command-link"
      />,
    );
    expect(screen.getByTestId('command-link')).toBeVisible();
  });

  it('merges extra className', () => {
    render(
      <CommandLink
        href="/"
        command="cd ~"
        ariaLabel="Return home"
        className="ml-2"
      />,
    );
    expect(
      screen.getByRole('link', { name: 'Return home' }).className,
    ).toContain('ml-2');
  });
});
