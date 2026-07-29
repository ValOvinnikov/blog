import { customRender, screen } from '@web/testing/custom-render';

import { SmartLink } from './smart-link';

const setup = customRender(SmartLink, {
  href: '/blog/hello-world',
  children: 'Read post',
});

describe('SmartLink', () => {
  it('renders the locale-aware router Link for an internal href, without target or rel', () => {
    setup();

    const link = screen.getByRole('link', { name: 'Read post' });
    expect(link).toHaveAttribute('href', '/blog/hello-world');
    expect(link).not.toHaveAttribute('target');
    expect(link).not.toHaveAttribute('rel');
  });

  it('renders an absolute external href through the locale-aware Link, adding rel for a new tab', () => {
    setup({
      href: 'https://example.com',
      target: '_blank',
      children: 'Visit site',
    });

    const link = screen.getByRole('link', { name: 'Visit site' });
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', 'https://example.com');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders a protocol-relative href through plain next/link, adding rel for a new tab', () => {
    setup({
      href: '//cdn.example.com/asset',
      target: '_blank',
      children: 'Open asset',
    });

    const link = screen.getByRole('link', { name: 'Open asset' });
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', '//cdn.example.com/asset');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
