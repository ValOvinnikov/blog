import { buildStarterDocuments, STARTER_DOCUMENT_IDS } from './starter-content';

describe(buildStarterDocuments, () => {
  const tenant = { name: 'Acme Corporation' };

  it('builds exactly the six starter documents, all published (no drafts. prefix)', () => {
    const documents = buildStarterDocuments(tenant);

    expect(documents.map((doc) => doc._type)).toEqual([
      'settings_navigation',
      'settings_footer',
      'settings_theme',
      'settings_newsletter',
      'settings_site',
      'page_home',
    ]);

    const ids = documents.map((doc) => doc._id);
    expect(ids).toEqual(Object.values(STARTER_DOCUMENT_IDS));
    expect(ids.every((id) => !id.startsWith('drafts.'))).toBe(true);
  });

  it('the site settings document has no defaultOgImage field', () => {
    const site = buildStarterDocuments(tenant).find(
      (doc) => doc._id === STARTER_DOCUMENT_IDS.SITE,
    );

    expect(site).not.toHaveProperty('defaultOgImage');
  });

  it('newsletter starter document carries both trust cue strings', () => {
    const newsletter = buildStarterDocuments(tenant).find(
      (doc) => doc._id === STARTER_DOCUMENT_IDS.NEWSLETTER,
    ) as unknown as { trustCues: string[] };

    expect(newsletter.trustCues).toEqual(['No spam', 'Unsubscribe anytime']);
  });

  it('settings_navigation seeds with an empty items array', () => {
    const navigation = buildStarterDocuments(tenant).find(
      (doc) => doc._id === STARTER_DOCUMENT_IDS.NAVIGATION,
    ) as unknown as { items: unknown[] };

    expect(navigation.items).toEqual([]);
  });

  it('page_home has no hero reference', () => {
    const home = buildStarterDocuments(tenant).find(
      (doc) => doc._id === STARTER_DOCUMENT_IDS.HOME,
    );

    expect(home).not.toHaveProperty('hero');
  });

  it('page_home carries a literal "Welcome" heading and a non-empty supporting line', () => {
    const home = buildStarterDocuments(tenant).find(
      (doc) => doc._id === STARTER_DOCUMENT_IDS.HOME,
    ) as unknown as {
      headingBlock: { _type: string; heading: string; supportingText: string };
    };

    expect(home.headingBlock._type).toBe('headingBlock');
    expect(home.headingBlock.heading).toBe('Welcome');
    expect(home.headingBlock.supportingText.length).toBeGreaterThan(0);
  });

  it('page_home carries a populated seo object, as homePageQuery requires', () => {
    const home = buildStarterDocuments(tenant).find(
      (doc) => doc._id === STARTER_DOCUMENT_IDS.HOME,
    ) as unknown as {
      seo: {
        _type: string;
        metaTitle: string;
        metaDescription?: string;
        openGraph?: { _type: string; ogTitle?: string; ogDescription?: string };
      };
    };

    expect(home.seo._type).toBe('seo');
    expect(home.seo.metaTitle.length).toBeGreaterThanOrEqual(30);
    expect(home.seo.metaTitle.length).toBeLessThanOrEqual(60);
  });

  it.each([
    ['a 1-character tenant name', 'x'],
    ['a 200-character tenant name', 'x'.repeat(200)],
  ])(
    'page_home.seo stays within every schema bound for %s (not derived from tenant.name)',
    (_label, name) => {
      const home = buildStarterDocuments({ name }).find(
        (doc) => doc._id === STARTER_DOCUMENT_IDS.HOME,
      ) as unknown as {
        seo: {
          metaTitle: string;
          metaDescription: string;
          openGraph: { ogTitle: string; ogDescription: string };
        };
      };

      expect(home.seo.metaTitle.length).toBeGreaterThanOrEqual(30);
      expect(home.seo.metaTitle.length).toBeLessThanOrEqual(60);
      expect(home.seo.metaDescription.length).toBeLessThanOrEqual(160);
      expect(home.seo.openGraph.ogTitle.length).toBeLessThanOrEqual(70);
      expect(home.seo.openGraph.ogDescription.length).toBeLessThanOrEqual(200);
    },
  );

  it('page_home.seo copy points editors at this page, not Site Settings', () => {
    const home = buildStarterDocuments(tenant).find(
      (doc) => doc._id === STARTER_DOCUMENT_IDS.HOME,
    ) as unknown as {
      seo: { metaDescription: string; openGraph: { ogDescription: string } };
    };

    expect(home.seo.metaDescription).not.toMatch(/site settings/i);
    expect(home.seo.openGraph.ogDescription).not.toMatch(/site settings/i);
  });
});
