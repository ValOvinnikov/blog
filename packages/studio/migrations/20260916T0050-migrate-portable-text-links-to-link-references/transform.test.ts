import type { MigrationContext } from 'sanity/migrate';

import {
  applyMarkDefOutcomes,
  buildLinkDocumentFields,
  deriveExternalLabel,
  describeMarkDef,
  findLegacyLinkBlocks,
  LINK_LABEL_MAX_LENGTH,
  resolveInlineLinkDestination,
  resolveRawHrefDestination,
  type TBlock,
  type TInlineLinkMarkDef,
} from './transform';

const createMockContext = (
  postsBySlug: Record<string, { _id: string; title?: string } | undefined> = {},
  titlesByRef: Record<string, string | undefined> = {},
): MigrationContext => {
  const fetch = async (query: string, params: unknown) => {
    if (query.includes('slug.current')) {
      const slug = (params as { slug: string }).slug;
      const post = postsBySlug[slug];

      return post ? [post] : [];
    }

    const ref = (params as { ref: string }).ref;

    return { title: titlesByRef[ref] };
  };

  return { client: { fetch } } as unknown as MigrationContext;
};

describe(deriveExternalLabel, () => {
  it('joins hostname and pathname, dropping a leading www.', () => {
    expect(deriveExternalLabel('https://www.example.com/pricing')).toBe(
      'example.com/pricing',
    );
  });

  it('drops the pathname when it is just the root', () => {
    expect(deriveExternalLabel('https://example.com/')).toBe('example.com');
  });

  it('falls back to the hostname when the full label is too long', () => {
    const url = `https://example.com/${'a'.repeat(LINK_LABEL_MAX_LENGTH)}`;

    expect(deriveExternalLabel(url)).toBe('example.com');
  });
});

describe(resolveRawHrefDestination, () => {
  it('resolves a /blog/<slug> href to the matching page_post', async () => {
    const context = createMockContext({
      'understanding-groq': { _id: 'page-post-1', title: 'Understanding GROQ' },
    });

    const destination = await resolveRawHrefDestination(
      context,
      '/blog/understanding-groq',
    );

    expect(destination).toEqual({
      linkType: 'INTERNAL',
      internalReference: { _ref: 'page-post-1' },
      title: 'Link to Understanding GROQ',
      label: 'Understanding GROQ',
    });
  });

  it('is undefined for a /blog/<slug> href matching no page_post', async () => {
    const context = createMockContext();

    const destination = await resolveRawHrefDestination(
      context,
      '/blog/nothing-merges-on-vibes',
    );

    expect(destination).toBeUndefined();
  });

  it('resolves a full https:// URL to an external destination', async () => {
    const context = createMockContext();

    const destination = await resolveRawHrefDestination(
      context,
      'https://github.com/FormidableLabs/groqd',
    );

    expect(destination).toEqual({
      linkType: 'EXTERNAL',
      url: 'https://github.com/FormidableLabs/groqd',
      title: 'Link to https://github.com/FormidableLabs/groqd',
      label: 'github.com/FormidableLabs/groqd',
    });
  });

  it('is undefined for an empty href', async () => {
    expect(
      await resolveRawHrefDestination(createMockContext(), undefined),
    ).toBeUndefined();
  });
});

describe(resolveInlineLinkDestination, () => {
  it('resolves an internal inlineLink, preferring its own label', async () => {
    const context = createMockContext(
      {},
      { 'page-post-1': 'Understanding GROQ' },
    );
    const markDef: TInlineLinkMarkDef = {
      _key: 'mark-1',
      _type: 'inlineLink',
      label: 'Read this',
      linkType: 'INTERNAL',
      internalReference: { _ref: 'page-post-1' },
    };

    const destination = await resolveInlineLinkDestination(context, markDef);

    expect(destination).toEqual({
      linkType: 'INTERNAL',
      internalReference: { _ref: 'page-post-1' },
      title: 'Link to Understanding GROQ',
      label: 'Read this',
    });
  });

  it('resolves an external inlineLink, deriving a label when none is set', async () => {
    const context = createMockContext();
    const markDef: TInlineLinkMarkDef = {
      _key: 'mark-1',
      _type: 'inlineLink',
      linkType: 'EXTERNAL',
      url: 'https://example.com/pricing',
    };

    const destination = await resolveInlineLinkDestination(context, markDef);

    expect(destination).toEqual({
      linkType: 'EXTERNAL',
      url: 'https://example.com/pricing',
      title: 'Link to https://example.com/pricing',
      label: 'example.com/pricing',
    });
  });

  it('is undefined for an internal inlineLink with no internalReference', async () => {
    const markDef: TInlineLinkMarkDef = {
      _key: 'mark-1',
      _type: 'inlineLink',
      linkType: 'INTERNAL',
    };

    expect(
      await resolveInlineLinkDestination(createMockContext(), markDef),
    ).toBeUndefined();
  });
});

describe(buildLinkDocumentFields, () => {
  it('carries internalReference for an INTERNAL destination', () => {
    const fields = buildLinkDocumentFields('link-abc123', {
      linkType: 'INTERNAL',
      internalReference: { _ref: 'page-post-1' },
      title: 'Link to Understanding GROQ',
      label: 'Understanding GROQ',
    });

    expect(fields).toEqual({
      _id: 'link-abc123',
      _type: 'link',
      title: 'Link to Understanding GROQ',
      label: 'Understanding GROQ',
      linkType: 'INTERNAL',
      internalReference: { _type: 'reference', _ref: 'page-post-1' },
    });
  });

  it('carries url for an EXTERNAL destination', () => {
    const fields = buildLinkDocumentFields('link-def456', {
      linkType: 'EXTERNAL',
      url: 'https://github.com/FormidableLabs/groqd',
      title: 'Link to https://github.com/FormidableLabs/groqd',
      label: 'github.com/FormidableLabs/groqd',
    });

    expect(fields).toEqual({
      _id: 'link-def456',
      _type: 'link',
      title: 'Link to https://github.com/FormidableLabs/groqd',
      label: 'github.com/FormidableLabs/groqd',
      linkType: 'EXTERNAL',
      url: 'https://github.com/FormidableLabs/groqd',
    });
  });
});

describe(describeMarkDef, () => {
  it('describes a raw-href markDef by its href', () => {
    expect(
      describeMarkDef({ _key: 'mark-1', _type: 'link', href: '/blog/missing' }),
    ).toBe('/blog/missing');
  });

  it('describes an inlineLink markDef by its url', () => {
    expect(
      describeMarkDef({
        _key: 'mark-1',
        _type: 'inlineLink',
        linkType: 'EXTERNAL',
        url: 'https://example.com',
      }),
    ).toBe('https://example.com');
  });

  it('falls back when neither href nor url/internalReference is set', () => {
    expect(describeMarkDef({ _key: 'mark-1', _type: 'link' })).toBe(
      '(no href set)',
    );
  });
});

describe(findLegacyLinkBlocks, () => {
  it('finds a block with a legacy markDef at a top-level field', () => {
    const doc = {
      _id: 'post-1',
      _type: 'page_post',
      content: [
        {
          _key: 'block-1',
          _type: 'block',
          markDefs: [{ _key: 'mark-1', _type: 'link', href: '/blog/a' }],
          children: [],
        },
      ],
    };

    const locations = findLegacyLinkBlocks(doc);

    expect(locations).toHaveLength(1);
    expect(locations[0]?.path).toEqual(['content', { _key: 'block-1' }]);
  });

  it('finds a block nested inside an aside object', () => {
    const doc = {
      _id: 'post-1',
      _type: 'page_post',
      content: [
        {
          _key: 'aside-1',
          _type: 'aside',
          kind: 'tip',
          body: [
            {
              _key: 'block-1',
              _type: 'block',
              markDefs: [{ _key: 'mark-1', _type: 'link', href: '/blog/a' }],
              children: [],
            },
          ],
        },
      ],
    };

    const locations = findLegacyLinkBlocks(doc);

    expect(locations).toHaveLength(1);
    expect(locations[0]?.path).toEqual([
      'content',
      { _key: 'aside-1' },
      'body',
      { _key: 'block-1' },
    ]);
  });

  it('ignores a block whose markDefs are already linkRef', () => {
    const doc = {
      _id: 'post-1',
      _type: 'page_post',
      content: [
        {
          _key: 'block-1',
          _type: 'block',
          markDefs: [
            {
              _key: 'mark-1',
              _type: 'linkRef',
              link: { _type: 'reference', _ref: 'link-1' },
            },
          ],
          children: [],
        },
      ],
    };

    expect(findLegacyLinkBlocks(doc)).toEqual([]);
  });

  it('ignores a block with no markDefs at all', () => {
    const doc = {
      _id: 'author-1',
      _type: 'blog_author',
      bio: [{ _key: 'block-1', _type: 'block', markDefs: [], children: [] }],
    };

    expect(findLegacyLinkBlocks(doc)).toEqual([]);
  });
});

describe(applyMarkDefOutcomes, () => {
  const block: TBlock = {
    _key: 'block-1',
    _type: 'block',
    markDefs: [
      { _key: 'mark-1', _type: 'link', href: '/blog/a' },
      { _key: 'mark-2', _type: 'link', href: '/blog/broken' },
    ],
    children: [
      { _key: 'span-1', _type: 'span', text: 'a', marks: ['mark-1'] },
      { _key: 'span-2', _type: 'span', text: 'b', marks: ['mark-2'] },
      { _key: 'span-3', _type: 'span', text: 'c', marks: ['mark-1', 'mark-2'] },
    ],
  };

  it('converts a resolved markDef to linkRef, leaving its marks untouched', () => {
    const { markDefs } = applyMarkDefOutcomes(block, [
      { outcome: 'CONVERTED', key: 'mark-1', linkId: 'link-1' },
      { outcome: 'CONVERTED', key: 'mark-2', linkId: 'link-2' },
    ]);

    expect(markDefs).toEqual([
      {
        _key: 'mark-1',
        _type: 'linkRef',
        link: { _type: 'reference', _ref: 'link-1' },
      },
      {
        _key: 'mark-2',
        _type: 'linkRef',
        link: { _type: 'reference', _ref: 'link-2' },
      },
    ]);
  });

  it('removes a stripped markDef and its mark reference from every span', () => {
    const { markDefs, children } = applyMarkDefOutcomes(block, [
      { outcome: 'CONVERTED', key: 'mark-1', linkId: 'link-1' },
      { outcome: 'STRIPPED', key: 'mark-2' },
    ]);

    expect(markDefs).toEqual([
      {
        _key: 'mark-1',
        _type: 'linkRef',
        link: { _type: 'reference', _ref: 'link-1' },
      },
    ]);
    expect(children).toEqual([
      { _key: 'span-1', _type: 'span', text: 'a', marks: ['mark-1'] },
      { _key: 'span-2', _type: 'span', text: 'b', marks: [] },
      { _key: 'span-3', _type: 'span', text: 'c', marks: ['mark-1'] },
    ]);
  });

  it('leaves a span with no marks array untouched', () => {
    const noMarksBlock: TBlock = {
      _key: 'block-2',
      _type: 'block',
      markDefs: [],
      children: [{ _key: 'span-1', _type: 'span', text: 'plain' }],
    };

    const { children } = applyMarkDefOutcomes(noMarksBlock, []);

    expect(children).toEqual([
      { _key: 'span-1', _type: 'span', text: 'plain' },
    ]);
  });
});
