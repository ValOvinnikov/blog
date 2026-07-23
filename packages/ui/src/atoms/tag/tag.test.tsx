import {
  customRender,
  renderElement,
  screen,
} from '@blog/ui/testing/custom-render';
import type { AnchorHTMLAttributes } from 'react';

import { Tag } from './tag';

const setup = customRender(Tag, { children: 'Label' });

describe(`<${Tag.name}/>`, () => {
  it('renders a span element', () => {
    setup();
    expect(screen.getByText('Label').tagName).toBe('SPAN');
  });

  it('default variant has a border', () => {
    setup();
    expect(screen.getByText('Label').className).toContain('border');
  });

  it('accent variant applies accent-muted background', () => {
    setup({ variant: 'accent' });
    expect(screen.getByText('Label').className).toContain('bg-accent-muted');
  });

  it('renders as an anchor when `as` is set to "a"', () => {
    renderElement(
      <Tag as="a" href="/category/architecture">
        Architecture
      </Tag>,
    );
    expect(screen.getByRole('link', { name: 'Architecture' })).toHaveAttribute(
      'href',
      '/category/architecture',
    );
  });

  it('renders with a custom component when `as` prop is provided', () => {
    const CustomLink = ({
      href,
      children,
      ...props
    }: AnchorHTMLAttributes<HTMLAnchorElement>) => (
      <a href={href} data-custom="true" {...props}>
        {children}
      </a>
    );
    renderElement(
      <Tag as={CustomLink} href="/custom">
        Custom
      </Tag>,
    );
    const link = screen.getByRole('link', { name: 'Custom' });
    expect(link).toHaveAttribute('data-custom', 'true');
    expect(link).toHaveAttribute('href', '/custom');
  });
});
