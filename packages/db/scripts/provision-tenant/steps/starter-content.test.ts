import { buildStarterDocuments, STARTER_DOCUMENT_IDS } from './starter-content';

describe(buildStarterDocuments, () => {
  const tenant = { name: 'Acme Corporation' };

  it('builds one document per starter id, all published (no drafts. prefix)', () => {
    const documents = buildStarterDocuments(tenant);
    const ids = documents.map((doc) => doc._id);

    expect(ids).toEqual(Object.values(STARTER_DOCUMENT_IDS));
    expect(ids.every((id) => !id.startsWith('drafts.'))).toBe(true);
  });

  it('site settings has description within the schema bounds (50-160 chars)', () => {
    const site = buildStarterDocuments(tenant).find(
      (doc) => doc._id === STARTER_DOCUMENT_IDS.SITE,
    );

    const description = (site as unknown as { description: string })
      .description;
    expect(description.length).toBeGreaterThanOrEqual(50);
    expect(description.length).toBeLessThanOrEqual(160);
  });

  it('post excerpt is within the schema bounds (50-300 chars)', () => {
    const post = buildStarterDocuments(tenant).find(
      (doc) => doc._id === STARTER_DOCUMENT_IDS.POST,
    );

    const excerpt = (post as unknown as { excerpt: string }).excerpt;
    expect(excerpt.length).toBeGreaterThanOrEqual(50);
    expect(excerpt.length).toBeLessThanOrEqual(300);
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

  it('the external nav link satisfies the link schema union (label + linkType + url)', () => {
    const navigation = buildStarterDocuments(tenant).find(
      (doc) => doc._id === STARTER_DOCUMENT_IDS.NAVIGATION,
    ) as unknown as {
      items: Array<{ label: string; linkType: string; url: string }>;
    };

    expect(navigation.items[0]).toMatchObject({
      label: 'Blog',
      linkType: 'EXTERNAL',
      url: '/blog',
    });
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
});
