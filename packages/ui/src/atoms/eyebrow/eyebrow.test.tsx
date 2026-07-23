import { customRender, screen } from '@blog/ui/testing/custom-render';
import type { ReactNode } from 'react';

import { Eyebrow } from './eyebrow';

const setup = customRender(Eyebrow, {
  children: 'Featured Post',
});

describe(`<${Eyebrow.name}/>`, () => {
  it('renders children', () => {
    setup();
    expect(screen.getByText('Featured Post')).toBeVisible();
  });

  it('renders as a <p> element', () => {
    const { container } = setup({ children: 'Label' });
    expect(container.firstChild?.nodeName).toBe('P');
  });

  it('renders as a link when href is provided', () => {
    setup({ href: '/category/engineering', children: 'Engineering' });
    expect(screen.getByRole('link', { name: 'Engineering' })).toHaveAttribute(
      'href',
      '/category/engineering',
    );
  });

  it('renders using the custom linkAs component when href is provided', () => {
    const CustomLink = ({
      href,
      children,
    }: {
      href: string;
      children?: ReactNode;
    }) => (
      <a href={href} data-custom="true">
        {children}
      </a>
    );
    setup({
      href: '/category/engineering',
      linkAs: CustomLink,
      children: 'Engineering',
    });
    expect(screen.getByRole('link', { name: 'Engineering' })).toHaveAttribute(
      'data-custom',
      'true',
    );
  });

  it('forwards dataTestId to the root element', () => {
    setup({ dataTestId: 'eyebrow' });
    expect(screen.getByTestId('eyebrow')).toBeVisible();
  });
});
