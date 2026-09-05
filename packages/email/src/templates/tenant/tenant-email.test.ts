import type { TTenantEmailBrand } from '@blog/email/html/tenant-shell';
import type { TPortableTextContent } from '@blog/email/portable-text';

import { buildTenantEmail } from './tenant-email';

const BRAND: TTenantEmailBrand = {
  surface: '#ffffff',
  surface2: '#f8f8fb',
  border: '#e4e4ec',
  text: '#1f1f2b',
  textMuted: '#6b6b7a',
  brandPrimary: '#3355dd',
  brandPrimarySolid: '#2244cc',
  brandPrimaryContrast: '#ffffff',
  logo1: '#3355dd',
  logo2: '#5577ee',
  logo3: '#88aaff',
};

const ACTION = { label: 'Sign in', url: 'https://example.com/sign-in' };

describe('buildTenantEmail', () => {
  it('renders the authored body followed by the action element', () => {
    const body: TPortableTextContent = [
      {
        _type: 'block',
        style: 'normal',
        children: [{ _type: 'span', text: 'Welcome back.' }],
      },
    ];

    const html = buildTenantEmail({
      brand: BRAND,
      brandName: 'Acme',
      body,
      action: ACTION,
    });

    expect(html.indexOf('Welcome back.')).toBeLessThan(
      html.indexOf(ACTION.url),
    );
  });

  it('renders the action element even when the authored body is empty', () => {
    const html = buildTenantEmail({
      brand: BRAND,
      brandName: 'Acme',
      body: [],
      action: ACTION,
    });

    expect(html).toContain(`href="${ACTION.url}"`);
    expect(html).toContain('>Sign in</a>');
  });

  it('renders the action element even when the authored body is null or undefined', () => {
    const htmlWithNull = buildTenantEmail({
      brand: BRAND,
      brandName: 'Acme',
      body: null,
      action: ACTION,
    });
    const htmlWithUndefined = buildTenantEmail({
      brand: BRAND,
      brandName: 'Acme',
      body: undefined,
      action: ACTION,
    });

    expect(htmlWithNull).toContain(`href="${ACTION.url}"`);
    expect(htmlWithUndefined).toContain(`href="${ACTION.url}"`);
  });

  it('no authored body content can remove the action element, even one that mimics it', () => {
    const impersonatingBody: TPortableTextContent = [
      {
        _type: 'block',
        style: 'normal',
        children: [
          {
            _type: 'span',
            text: `Sign in ${ACTION.url}`,
          },
        ],
      },
      {
        _type: 'unsupportedFutureBlock',
        label: 'Sign in',
        url: 'https://evil.example/sign-in',
      },
    ];

    const html = buildTenantEmail({
      brand: BRAND,
      brandName: 'Acme',
      body: impersonatingBody,
      action: ACTION,
    });

    expect(html).toContain(`href="${ACTION.url}"`);
    expect(html).not.toContain('evil.example');
    expect(html.match(new RegExp(`href="${ACTION.url}"`, 'g'))).toHaveLength(1);
  });

  it('renders the action in the tenant brand colours', () => {
    const html = buildTenantEmail({
      brand: BRAND,
      brandName: 'Acme',
      body: [],
      action: ACTION,
    });

    expect(html).toContain(BRAND.brandPrimarySolid);
    expect(html).toContain(BRAND.brandPrimaryContrast);
  });

  it('escapes an authored body that attempts to inject markup', () => {
    const html = buildTenantEmail({
      brand: BRAND,
      brandName: 'Acme',
      body: [
        {
          _type: 'block',
          style: 'normal',
          children: [{ _type: 'span', text: '<img src=x onerror=steal()>' }],
        },
      ],
      action: ACTION,
    });

    expect(html).not.toContain('<img src=x onerror=steal()>');
  });

  it('renders byte-identical output when logoImageUrl and footerPostalAddress are omitted vs explicitly undefined', () => {
    const body: TPortableTextContent = [
      {
        _type: 'block',
        style: 'normal',
        children: [{ _type: 'span', text: 'Welcome back.' }],
      },
    ];

    const withoutOptionals = buildTenantEmail({
      brand: BRAND,
      brandName: 'Acme',
      body,
      action: ACTION,
    });
    const withUndefinedOptionals = buildTenantEmail({
      brand: BRAND,
      brandName: 'Acme',
      body,
      action: ACTION,
      logoImageUrl: undefined,
      footerPostalAddress: undefined,
    });

    expect(withUndefinedOptionals).toBe(withoutOptionals);
  });

  it('forwards a given logo URL and footer postal address to the shell', () => {
    const html = buildTenantEmail({
      brand: BRAND,
      brandName: 'Acme',
      body: [],
      action: ACTION,
      logoImageUrl: 'https://cdn.example.com/logo.png',
      footerPostalAddress: '123 Main St, Springfield',
    });

    expect(html).toContain('<img src="https://cdn.example.com/logo.png"');
    expect(html).toContain('123 Main St, Springfield');
  });

  it('renders no action element at all when action is omitted', () => {
    const html = buildTenantEmail({
      brand: BRAND,
      brandName: 'Acme',
      body: [
        {
          _type: 'block',
          style: 'normal',
          children: [{ _type: 'span', text: 'Just an update.' }],
        },
      ],
    });

    expect(html).toContain('Just an update.');
    expect(html).not.toContain('<a href=');
  });
});
