import {
  COPYRIGHT_ENTITY,
  DOCTYPE,
  MOCK_BODY_HTML,
  MOCK_ESCAPED_SCRIPT_MARKUP,
  MOCK_ESCAPED_UNSAFE_MARKUP,
  MOCK_JAVASCRIPT_URL,
  MOCK_LINK_HTML,
  MOCK_LOGO_URL,
  MOCK_NOW,
  MOCK_POSTAL_ADDRESS,
  MOCK_SCRIPT_MARKUP,
  MOCK_STRUCTURAL_HTML,
  MOCK_TENANT_NAME,
  MOCK_UNSAFE_MARKUP,
  PREHEADER_STYLE,
} from '@blog/email/testing/email-fixtures';
import { MOCK_TENANT_EMAIL_BRAND } from '@blog/email/testing/tenant-email-brand';
import { faker } from '@faker-js/faker';

import { buildTenantShell, type TTenantEmailBrand } from './tenant-shell';

faker.seed(6026);

const MOCK_BORDER_COLOUR = faker.color.rgb();

const MOCK_SHELL_INPUT = {
  brand: MOCK_TENANT_EMAIL_BRAND,
  brandName: MOCK_TENANT_NAME,
  bodyHtml: MOCK_BODY_HTML,
};

describe(buildTenantShell, () => {
  describe('with only a brand, a brand name and body HTML', () => {
    let html: string;

    beforeEach(() => {
      vi.useFakeTimers({ now: MOCK_NOW });
      html = buildTenantShell(MOCK_SHELL_INPUT);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('wraps the body in a full English HTML document', () => {
      expect(html).toContain(DOCTYPE);
      expect(html).toContain('<html lang="en">');
      expect(html).toContain(MOCK_BODY_HTML);
    });

    it('omits the preheader when no preview text is given', () => {
      expect(html).not.toContain(PREHEADER_STYLE);
    });

    it('inlines the brand palette as hex values', () => {
      expect(html).toContain(MOCK_TENANT_EMAIL_BRAND.surface);
      expect(html).toContain(MOCK_TENANT_EMAIL_BRAND.border);
      expect(html).not.toContain('var(--');
    });

    it('names the brand and the current year in the copyright line', () => {
      expect(html).toContain(
        `${COPYRIGHT_ENTITY} ${MOCK_NOW.getFullYear()} ${MOCK_TENANT_NAME}`,
      );
    });

    it('draws the generated mark when no logo is uploaded', () => {
      expect(html).not.toContain('<img');
      expect(html).toContain('<svg');
    });

    it.each([
      'actionHtml',
      'structuralHtml',
      'logoImageUrl',
      'footerPostalAddress',
    ])('renders the same email for an undefined %s as for none', (key) => {
      const withUndefinedOptional = buildTenantShell({
        ...MOCK_SHELL_INPUT,
        [key]: undefined,
      });

      expect(withUndefinedOptional).toBe(html);
    });
  });

  it('leaves the body HTML unescaped', () => {
    const html = buildTenantShell({
      ...MOCK_SHELL_INPUT,
      bodyHtml: `<p>${MOCK_LINK_HTML}</p>`,
    });

    expect(html).toContain(MOCK_LINK_HTML);
  });

  it('escapes the brand name wherever it is interpolated', () => {
    const html = buildTenantShell({
      ...MOCK_SHELL_INPUT,
      brandName: MOCK_SCRIPT_MARKUP,
    });

    expect(html).not.toContain(MOCK_SCRIPT_MARKUP);
    expect(html).toContain(MOCK_ESCAPED_SCRIPT_MARKUP);
  });

  it('renders the escaped preview text in a hidden preheader', () => {
    const html = buildTenantShell({
      ...MOCK_SHELL_INPUT,
      previewText: MOCK_SCRIPT_MARKUP,
    });

    expect(html).toContain(PREHEADER_STYLE);
    expect(html).toContain(MOCK_ESCAPED_SCRIPT_MARKUP);
  });

  it('renders the palette of whichever brand it is given', () => {
    const otherBrand: TTenantEmailBrand = {
      ...MOCK_TENANT_EMAIL_BRAND,
      border: MOCK_BORDER_COLOUR,
    };

    const html = buildTenantShell({ ...MOCK_SHELL_INPUT, brand: otherBrand });

    expect(html).toContain(MOCK_BORDER_COLOUR);
    expect(html).not.toContain(MOCK_TENANT_EMAIL_BRAND.border);
  });

  it('renders the action HTML between the body and the footer', () => {
    const html = buildTenantShell({
      ...MOCK_SHELL_INPUT,
      actionHtml: MOCK_LINK_HTML,
    });

    const bodyIndex = html.indexOf(MOCK_BODY_HTML);
    const actionIndex = html.indexOf(MOCK_LINK_HTML);
    const footerIndex = html.indexOf(COPYRIGHT_ENTITY);

    expect(bodyIndex).toBeLessThan(actionIndex);
    expect(actionIndex).toBeLessThan(footerIndex);
  });

  it('renders the structural HTML between the body and the action', () => {
    const html = buildTenantShell({
      ...MOCK_SHELL_INPUT,
      structuralHtml: MOCK_STRUCTURAL_HTML,
      actionHtml: MOCK_LINK_HTML,
    });

    const bodyIndex = html.indexOf(MOCK_BODY_HTML);
    const structuralIndex = html.indexOf(MOCK_STRUCTURAL_HTML);
    const actionIndex = html.indexOf(MOCK_LINK_HTML);

    expect(bodyIndex).toBeLessThan(structuralIndex);
    expect(structuralIndex).toBeLessThan(actionIndex);
  });

  it('renders the structural HTML before the footer when there is no action', () => {
    const html = buildTenantShell({
      ...MOCK_SHELL_INPUT,
      structuralHtml: MOCK_STRUCTURAL_HTML,
    });

    const bodyIndex = html.indexOf(MOCK_BODY_HTML);
    const structuralIndex = html.indexOf(MOCK_STRUCTURAL_HTML);
    const footerIndex = html.indexOf(COPYRIGHT_ENTITY);

    expect(bodyIndex).toBeLessThan(structuralIndex);
    expect(structuralIndex).toBeLessThan(footerIndex);
  });

  it('renders an uploaded logo at a fixed size with escaped alt text', () => {
    const html = buildTenantShell({
      ...MOCK_SHELL_INPUT,
      brandName: MOCK_UNSAFE_MARKUP,
      logoImageUrl: MOCK_LOGO_URL,
    });

    expect(html).toContain(`<img src="${MOCK_LOGO_URL}"`);
    expect(html).toContain('width="32" height="32"');
    expect(html).toContain(`alt="${MOCK_ESCAPED_UNSAFE_MARKUP} logo"`);
    expect(html).not.toContain('<svg');
  });

  it('falls back to the generated mark when the logo URL is unsafe', () => {
    const html = buildTenantShell({
      ...MOCK_SHELL_INPUT,
      logoImageUrl: MOCK_JAVASCRIPT_URL,
    });

    expect(html).not.toContain('<img');
    expect(html).toContain('<svg');
  });

  it('renders the escaped postal address beneath the copyright line', () => {
    const html = buildTenantShell({
      ...MOCK_SHELL_INPUT,
      footerPostalAddress: `${MOCK_POSTAL_ADDRESS} ${MOCK_UNSAFE_MARKUP}`,
    });

    const copyrightIndex = html.indexOf(COPYRIGHT_ENTITY);
    const addressIndex = html.indexOf(
      `${MOCK_POSTAL_ADDRESS} ${MOCK_ESCAPED_UNSAFE_MARKUP}`,
    );

    expect(copyrightIndex).toBeGreaterThan(-1);
    expect(addressIndex).toBeGreaterThan(copyrightIndex);
  });

  it('requires a brand at compile time', () => {
    function callWithoutBrand(): string {
      // @ts-expect-error -- a tenant email must not silently fall back to the platform palette.
      return buildTenantShell({
        brandName: MOCK_TENANT_NAME,
        bodyHtml: MOCK_BODY_HTML,
      });
    }

    expect(callWithoutBrand).toBeInstanceOf(Function);
  });
});
