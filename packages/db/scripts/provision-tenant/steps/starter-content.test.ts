import { buildStarterDocuments, STARTER_DOCUMENT_IDS } from './starter-content';

describe(buildStarterDocuments, () => {
  const tenant = { name: 'Acme Corporation' };

  it('builds one document per starter id, all published (no drafts. prefix)', () => {
    const documents = buildStarterDocuments(tenant);
    const ids = documents.map((doc) => doc._id);

    expect(ids).toEqual(Object.values(STARTER_DOCUMENT_IDS));
    expect(ids.every((id) => !id.startsWith('drafts.'))).toBe(true);
  });

  it('post excerpt is within the schema bounds (50-300 chars)', () => {
    const post = buildStarterDocuments(tenant).find(
      (doc) => doc._id === STARTER_DOCUMENT_IDS.POST,
    );

    const excerpt = (post as unknown as { excerpt: string }).excerpt;
    expect(excerpt.length).toBeGreaterThanOrEqual(50);
    expect(excerpt.length).toBeLessThanOrEqual(300);
  });

  it('post is a page_post with an empty modules array', () => {
    const post = buildStarterDocuments(tenant).find(
      (doc) => doc._id === STARTER_DOCUMENT_IDS.POST,
    ) as unknown as { _type: string; modules: unknown[] };

    expect(post._type).toBe('page_post');
    expect(post.modules).toEqual([]);
  });

  it('post references the starter author and topic by id', () => {
    const post = buildStarterDocuments(tenant).find(
      (doc) => doc._id === STARTER_DOCUMENT_IDS.POST,
    ) as unknown as { author: { _ref: string }; topic: { _ref: string } };

    expect(post.author._ref).toBe(STARTER_DOCUMENT_IDS.AUTHOR);
    expect(post.topic._ref).toBe(STARTER_DOCUMENT_IDS.TOPIC);
  });

  it('the author document has no image and no slug field', () => {
    const author = buildStarterDocuments(tenant).find(
      (doc) => doc._id === STARTER_DOCUMENT_IDS.AUTHOR,
    );

    expect(author).not.toHaveProperty('image');
    expect(author).not.toHaveProperty('slug');
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

  it('the nav item is a linkRef with no inline label/linkType/url, referencing the starter link document', () => {
    const navigation = buildStarterDocuments(tenant).find(
      (doc) => doc._id === STARTER_DOCUMENT_IDS.NAVIGATION,
    ) as unknown as {
      items: Array<{ _type: string; link: { _ref: string } }>;
    };

    const item = navigation.items[0];
    expect(item).toBeDefined();
    expect(item?._type).toBe('linkRef');
    expect(item?.link._ref).toBe(STARTER_DOCUMENT_IDS.NAV_HOME_LINK);
    expect(item).not.toHaveProperty('label');
    expect(item).not.toHaveProperty('linkType');
    expect(item).not.toHaveProperty('url');
  });

  it('the starter link document is an INTERNAL link to the seeded home page, satisfying the link schema', () => {
    const link = buildStarterDocuments(tenant).find(
      (doc) => doc._id === STARTER_DOCUMENT_IDS.NAV_HOME_LINK,
    ) as unknown as {
      _type: string;
      title: string;
      label: string;
      linkType: string;
      internalReference: { _ref: string };
    };

    expect(link._type).toBe('link');
    expect(link.title).toBeTruthy();
    expect(link.label).toBe('Home');
    expect(link.linkType).toBe('INTERNAL');
    expect(link.internalReference._ref).toBe(STARTER_DOCUMENT_IDS.HOME);
    expect(link).not.toHaveProperty('url');
  });

  it('builds a module_heroBlog document pinned to the starter post, with no copy overrides', () => {
    const hero = buildStarterDocuments(tenant).find(
      (doc) => doc._id === STARTER_DOCUMENT_IDS.HERO_BLOG,
    ) as unknown as {
      _type: string;
      title: string;
      brandVariant: string;
      postSource: string;
      post: { _ref: string };
      imageSource: string;
      variant: string;
      eyebrow?: string;
      heading?: string;
      supportingText?: string;
    };

    expect(hero._type).toBe('module_heroBlog');
    expect(hero.title).toBeTruthy();
    expect(hero.brandVariant).toBeTruthy();
    expect(hero.postSource).toBe('PINNED');
    expect(hero.post._ref).toBe(STARTER_DOCUMENT_IDS.POST);
    expect(hero.imageSource).toBe('POST');
    expect(hero.variant).toBe('SPLIT');
    expect(hero).not.toHaveProperty('eyebrow');
    expect(hero).not.toHaveProperty('heading');
    expect(hero).not.toHaveProperty('supportingText');
  });

  it('builds a page_home document whose hero reference resolves to the starter heroBlog', () => {
    const home = buildStarterDocuments(tenant).find(
      (doc) => doc._id === STARTER_DOCUMENT_IDS.HOME,
    ) as unknown as {
      _type: string;
      title: string;
      hero: { _ref: string };
    };

    expect(home._type).toBe('page_home');
    expect(home.title).toBeTruthy();
    expect(home.hero._ref).toBe(STARTER_DOCUMENT_IDS.HERO_BLOG);
  });

  it('page_home carries a non-empty headingBlock.heading, as homePageQuery requires', () => {
    const home = buildStarterDocuments(tenant).find(
      (doc) => doc._id === STARTER_DOCUMENT_IDS.HOME,
    ) as unknown as {
      headingBlock: { _type: string; heading: string };
    };

    expect(home.headingBlock._type).toBe('headingBlock');
    expect(home.headingBlock.heading.length).toBeGreaterThan(0);
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
