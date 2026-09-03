import { buildStarterDocuments, STARTER_DOCUMENT_IDS } from './starter-content';

describe(buildStarterDocuments, () => {
  const tenant = { name: 'Acme Corporation' };
  const assets = {
    authorImageAssetId: 'image-author',
    ogImageAssetId: 'image-og',
  };

  it('builds one document per starter id, all published (no drafts. prefix)', () => {
    const documents = buildStarterDocuments(tenant, assets);
    const ids = documents.map((doc) => doc._id);

    expect(ids).toEqual(Object.values(STARTER_DOCUMENT_IDS));
    expect(ids.every((id) => !id.startsWith('drafts.'))).toBe(true);
  });

  it('site settings has description within the schema bounds (50-160 chars)', () => {
    const site = buildStarterDocuments(tenant, assets).find(
      (doc) => doc._id === STARTER_DOCUMENT_IDS.SITE,
    );

    const description = (site as unknown as { description: string })
      .description;
    expect(description.length).toBeGreaterThanOrEqual(50);
    expect(description.length).toBeLessThanOrEqual(160);
  });

  it('post excerpt is within the schema bounds (50-300 chars)', () => {
    const post = buildStarterDocuments(tenant, assets).find(
      (doc) => doc._id === STARTER_DOCUMENT_IDS.POST,
    );

    const excerpt = (post as unknown as { excerpt: string }).excerpt;
    expect(excerpt.length).toBeGreaterThanOrEqual(50);
    expect(excerpt.length).toBeLessThanOrEqual(300);
  });

  it('post references the starter author and topic by id', () => {
    const post = buildStarterDocuments(tenant, assets).find(
      (doc) => doc._id === STARTER_DOCUMENT_IDS.POST,
    ) as unknown as { author: { _ref: string }; topic: { _ref: string } };

    expect(post.author._ref).toBe(STARTER_DOCUMENT_IDS.AUTHOR);
    expect(post.topic._ref).toBe(STARTER_DOCUMENT_IDS.TOPIC);
  });

  it('wires the uploaded asset ids into author image and default OG image', () => {
    const documents = buildStarterDocuments(tenant, assets);
    const author = documents.find(
      (doc) => doc._id === STARTER_DOCUMENT_IDS.AUTHOR,
    ) as unknown as {
      image: { asset: { _ref: string } };
    };
    const site = documents.find(
      (doc) => doc._id === STARTER_DOCUMENT_IDS.SITE,
    ) as unknown as {
      defaultOgImage: { asset: { _ref: string } };
    };

    expect(author.image.asset._ref).toBe('image-author');
    expect(site.defaultOgImage.asset._ref).toBe('image-og');
  });

  it('the author document has no slug field (not a blog_author schema field)', () => {
    const author = buildStarterDocuments(tenant, assets).find(
      (doc) => doc._id === STARTER_DOCUMENT_IDS.AUTHOR,
    );

    expect(author).not.toHaveProperty('slug');
  });

  it('the external nav link satisfies the link schema union (label + linkType + url)', () => {
    const navigation = buildStarterDocuments(tenant, assets).find(
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

  it('seeds a module_hero document whose featuredPost references the starter post', () => {
    const hero = buildStarterDocuments(tenant, assets).find(
      (doc) => doc._id === STARTER_DOCUMENT_IDS.HERO,
    ) as unknown as { _type: string; featuredPost: { _ref: string } };

    expect(hero._type).toBe('module_hero');
    expect(hero.featuredPost._ref).toBe(STARTER_DOCUMENT_IDS.POST);
  });

  it('seeds a page_home document whose hero references the starter hero', () => {
    const home = buildStarterDocuments(tenant, assets).find(
      (doc) => doc._id === STARTER_DOCUMENT_IDS.HOME,
    ) as unknown as { _type: string; hero: { _ref: string } };

    expect(home._type).toBe('page_home');
    expect(home.hero._ref).toBe(STARTER_DOCUMENT_IDS.HERO);
  });
});
