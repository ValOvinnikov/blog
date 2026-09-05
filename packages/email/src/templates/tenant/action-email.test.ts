import type { TTenantEmailBrand } from '@blog/email/html/tenant-shell';
import type { TPortableTextContent } from '@blog/email/portable-text';

import { buildTenantActionEmail } from './action-email';

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

describe('buildTenantActionEmail', () => {
  it('renders the authored body followed by the action element', () => {
    const body: TPortableTextContent = [
      {
        _type: 'block',
        style: 'normal',
        children: [{ _type: 'span', text: 'Welcome back.' }],
      },
    ];

    const html = buildTenantActionEmail({
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
    const html = buildTenantActionEmail({
      brand: BRAND,
      brandName: 'Acme',
      body: [],
      action: ACTION,
    });

    expect(html).toContain(`href="${ACTION.url}"`);
    expect(html).toContain('>Sign in</a>');
  });

  it('renders the action element even when the authored body is null or undefined', () => {
    const htmlWithNull = buildTenantActionEmail({
      brand: BRAND,
      brandName: 'Acme',
      body: null,
      action: ACTION,
    });
    const htmlWithUndefined = buildTenantActionEmail({
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

    const html = buildTenantActionEmail({
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
    const html = buildTenantActionEmail({
      brand: BRAND,
      brandName: 'Acme',
      body: [],
      action: ACTION,
    });

    expect(html).toContain(BRAND.brandPrimarySolid);
    expect(html).toContain(BRAND.brandPrimaryContrast);
  });

  it('escapes an authored body that attempts to inject markup', () => {
    const html = buildTenantActionEmail({
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
});
