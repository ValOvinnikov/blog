import { buildStarterDocuments } from './starter-content';
import type { TStarterDocumentUnion } from './starter-document';

type TStarterType = TStarterDocumentUnion['_type'];

function findByType<TType extends TStarterType>(
  type: TType,
  name = 'Acme Corporation',
) {
  const document = buildStarterDocuments(name).find(
    (doc): doc is Extract<TStarterDocumentUnion, { _type: TType }> =>
      doc._type === type,
  );
  if (!document) throw new Error(`no ${type} starter document`);
  return document;
}

describe(buildStarterDocuments, () => {
  it('builds every starter document once, all published (no drafts. prefix)', () => {
    const documents = buildStarterDocuments('Acme Corporation');

    expect(documents.map((doc) => doc._type)).toEqual([
      'settings_navigation',
      'settings_footer',
      'settings_site',
      'template_home',
      'page_home',
      'template_postIndex',
      'page_postIndex',
    ]);

    const ids = documents.map((doc) => doc._id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((id) => !id.startsWith('drafts.'))).toBe(true);
  });

  it('builds the same ids on every run, so a re-seed targets the documents it already created', () => {
    const [acmeIds, globexIds] = ['Acme', 'Globex'].map((name) =>
      buildStarterDocuments(name).map(({ _id }) => _id),
    );

    expect(acmeIds).toEqual(globexIds);
  });

  it('the site settings document has no defaultOgImage field', () => {
    expect(findByType('settings_site')).not.toHaveProperty('defaultOgImage');
  });

  it('the site settings document seeds USD as the currency', () => {
    expect(findByType('settings_site')).toHaveProperty('currency', 'USD');
  });

  it('the site settings brand carries the site name', () => {
    expect(findByType('settings_site', 'Globex').brand?.name).toBe('Globex');
  });

  it('settings_navigation seeds with an empty items array', () => {
    expect(findByType('settings_navigation').items).toEqual([]);
  });

  it('page_home references the seeded home template', () => {
    expect(findByType('page_home').template).toEqual({
      _type: 'reference',
      _ref: findByType('template_home')._id,
    });
  });

  it('page_postIndex references the seeded post index template', () => {
    expect(findByType('page_postIndex').template).toEqual({
      _type: 'reference',
      _ref: findByType('template_postIndex')._id,
    });
  });

  it('neither seeded template sets a hero', () => {
    expect(findByType('template_home')).not.toHaveProperty('hero');
    expect(findByType('template_postIndex')).not.toHaveProperty('hero');
  });

  it('page_home carries a literal "Welcome" heading and a non-empty supporting line', () => {
    const { headingBlock } = findByType('page_home');

    expect(headingBlock._type).toBe('pageHeadingBlock');
    expect(headingBlock.heading).toBe('Welcome');
    expect(headingBlock.supportingText?.length).toBeGreaterThan(0);
  });

  it('page_postIndex carries a literal "Blog" heading', () => {
    expect(findByType('page_postIndex').headingBlock.heading).toBe('Blog');
  });

  it.each([
    ['page_home', 'a 1-character site name', 'x'],
    ['page_home', 'a 200-character site name', 'x'.repeat(200)],
    ['page_postIndex', 'a 1-character site name', 'x'],
    ['page_postIndex', 'a 200-character site name', 'x'.repeat(200)],
  ] as const)(
    '%s.seo stays within every schema bound for %s (not derived from the site name)',
    (type, _label, name) => {
      const { seo } = findByType(type, name);

      expect(seo._type).toBe('seo');
      expect(seo.metaTitle?.length).toBeGreaterThanOrEqual(30);
      expect(seo.metaTitle?.length).toBeLessThanOrEqual(60);
      expect(seo.metaDescription?.length).toBeLessThanOrEqual(160);
      expect(seo.openGraph?.ogTitle?.length).toBeLessThanOrEqual(70);
      expect(seo.openGraph?.ogDescription?.length).toBeLessThanOrEqual(200);
    },
  );

  it.each(['page_home', 'page_postIndex'] as const)(
    '%s.seo copy points editors at this page, not Site Settings',
    (type) => {
      const { seo } = findByType(type);

      expect(seo.metaDescription).not.toMatch(/site settings/i);
      expect(seo.openGraph?.ogDescription).not.toMatch(/site settings/i);
    },
  );
});
