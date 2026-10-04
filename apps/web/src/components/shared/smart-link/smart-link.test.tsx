import { LOCALE_ISO_CODES, routes } from '@blog/config';
import { render } from '@testing-library/react';
import { customRender, screen } from '@web/testing/custom-render';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';

import { SmartLink } from './smart-link';

const setup = customRender(SmartLink, {
  href: '/blog/hello-world',
  children: 'Read post',
});

describe(`<${SmartLink.name}/>`, () => {
  it('renders the locale-aware router Link for an internal href, without target or rel', () => {
    setup();

    const link = screen.getByRole('link', { name: 'Read post' });
    expect(link).toHaveAttribute('href', '/blog/hello-world');
    expect(link).not.toHaveAttribute('target');
    expect(link).not.toHaveAttribute('rel');
  });

  it('prefixes an internal landing page href with a non-default language', () => {
    const DutchProviders = ({ children }: { children: ReactNode }) => (
      <NextIntlClientProvider locale={LOCALE_ISO_CODES.NL} messages={{}}>
        {children}
      </NextIntlClientProvider>
    );

    render(
      <SmartLink href={routes.landingPage('over-ons')}>Over ons</SmartLink>,
      {
        wrapper: DutchProviders,
      },
    );

    expect(screen.getByRole('link', { name: 'Over ons' })).toHaveAttribute(
      'href',
      '/nl/over-ons',
    );
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

  it('renders normally when prefetch is disabled (e.g. a file-download link)', () => {
    setup({
      href: '/api/account/export',
      prefetch: false,
      children: 'Download',
    });

    const link = screen.getByRole('link', { name: 'Download' });
    expect(link).toHaveAttribute('href', '/api/account/export');
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
