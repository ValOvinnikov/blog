import { PLATFORM_EMAIL_BRAND } from '@blog/email/html/platform-email-brand/platform-email-brand';
import {
  COPYRIGHT_ENTITY,
  DOCTYPE,
  MOCK_BODY_HTML,
  MOCK_ESCAPED_SCRIPT_MARKUP,
  MOCK_LINK_HTML,
  MOCK_SCRIPT_MARKUP,
  MOCK_STRUCTURAL_HTML,
  OPERATOR_BRAND_NAME,
  PREHEADER_STYLE,
} from '@blog/email/testing/email-fixtures';
import { faker } from '@faker-js/faker';

import { buildNeutralShell } from './neutral-shell';

faker.seed(6026);

const MOCK_TITLE = faker.lorem.words(3);

describe(buildNeutralShell, () => {
  describe('with only a title and body HTML', () => {
    let html: string;

    beforeEach(() => {
      html = buildNeutralShell({ title: MOCK_TITLE, bodyHtml: MOCK_BODY_HTML });
    });

    it('wraps the body in a full HTML document', () => {
      expect(html).toContain(DOCTYPE);
      expect(html).toContain(MOCK_BODY_HTML);
    });

    it('titles the document with the given title', () => {
      expect(html).toContain(`<title>${MOCK_TITLE}</title>`);
    });

    it('renders no brand header and no footer', () => {
      expect(html).not.toContain('<svg');
      expect(html).not.toContain('<img');
      expect(html).not.toContain(COPYRIGHT_ENTITY);
      expect(html).not.toContain('border-top');
    });

    it('renders no operator branding', () => {
      expect(html).not.toContain(OPERATOR_BRAND_NAME);
      expect(html).not.toContain(PLATFORM_EMAIL_BRAND.surface2);
    });

    it('renders no preheader when no preview text is given', () => {
      expect(html).not.toContain(PREHEADER_STYLE);
    });
  });

  it('escapes the title', () => {
    const html = buildNeutralShell({
      title: MOCK_SCRIPT_MARKUP,
      bodyHtml: MOCK_BODY_HTML,
    });

    expect(html).not.toContain(MOCK_SCRIPT_MARKUP);
    expect(html).toContain(MOCK_ESCAPED_SCRIPT_MARKUP);
  });

  it('renders structural and action HTML after the body', () => {
    const html = buildNeutralShell({
      title: MOCK_TITLE,
      bodyHtml: MOCK_BODY_HTML,
      structuralHtml: MOCK_STRUCTURAL_HTML,
      actionHtml: MOCK_LINK_HTML,
    });

    const bodyIndex = html.indexOf(MOCK_BODY_HTML);
    const structuralIndex = html.indexOf(MOCK_STRUCTURAL_HTML);
    const actionIndex = html.indexOf(MOCK_LINK_HTML);

    expect(bodyIndex).toBeLessThan(structuralIndex);
    expect(structuralIndex).toBeLessThan(actionIndex);
  });

  it('cannot be passed a brand name at compile time', () => {
    const html = buildNeutralShell({
      title: MOCK_TITLE,
      // @ts-expect-error -- an unresolved tenant has no defensible name, so the neutral shell accepts none.
      brandName: OPERATOR_BRAND_NAME,
      bodyHtml: MOCK_BODY_HTML,
    });

    expect(html).not.toContain(OPERATOR_BRAND_NAME);
  });

  it('cannot be passed a brand palette at compile time', () => {
    const html = buildNeutralShell({
      title: MOCK_TITLE,
      // @ts-expect-error -- the neutral shell's palette is fixed, so no tenant or operator palette can reach it.
      brand: PLATFORM_EMAIL_BRAND,
      bodyHtml: MOCK_BODY_HTML,
    });

    expect(html).not.toContain(PLATFORM_EMAIL_BRAND.surface2);
  });
});
