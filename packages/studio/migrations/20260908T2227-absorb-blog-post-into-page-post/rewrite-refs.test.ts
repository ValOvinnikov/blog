import { at, patch, set } from 'sanity/migrate';

import { collectRefRewritePatches, rewriteRefsDeep } from './rewrite-refs';

describe('rewriteRefsDeep', () => {
  it('rewrites a top-level reference found in the id map', () => {
    const idMap = new Map([['post-1', 'page_post-post-1']]);

    expect(
      rewriteRefsDeep({ _type: 'reference', _ref: 'post-1' }, idMap),
    ).toEqual({ _type: 'reference', _ref: 'page_post-post-1' });
  });

  it('rewrites a reference nested inside a Portable Text markDef', () => {
    const idMap = new Map([['post-2', 'page_post-post-2']]);
    const body = [
      {
        _type: 'block',
        _key: 'block-1',
        markDefs: [
          {
            _type: 'link',
            _key: 'mark-1',
            internalReference: { _type: 'reference', _ref: 'post-2' },
          },
        ],
        children: [{ _type: 'span', _key: 'span-1', text: 'hello' }],
      },
    ];

    const rewritten = rewriteRefsDeep(body, idMap) as typeof body;

    expect(
      (rewritten[0]!.markDefs[0] as { internalReference: { _ref: string } })
        .internalReference._ref,
    ).toBe('page_post-post-2');
  });

  it('leaves references absent from the id map unchanged', () => {
    const idMap = new Map([['post-1', 'page_post-post-1']]);

    expect(
      rewriteRefsDeep({ _type: 'reference', _ref: 'author-1' }, idMap),
    ).toEqual({ _type: 'reference', _ref: 'author-1' });
  });

  it('leaves primitives unchanged', () => {
    const idMap = new Map<string, string>();

    expect(rewriteRefsDeep('hello', idMap)).toBe('hello');
    expect(rewriteRefsDeep(3, idMap)).toBe(3);
    expect(rewriteRefsDeep(undefined, idMap)).toBeUndefined();
  });
});

describe('collectRefRewritePatches', () => {
  it('returns undefined when no ref in the document matches the id map', () => {
    const idMap = new Map([['post-1', 'page_post-post-1']]);
    const doc = { _id: 'doc-1', _type: 'module_hero', title: 'Hero' };

    expect(collectRefRewritePatches(doc, idMap)).toBeUndefined();
  });

  it('rewrites module_hero.featuredPost', () => {
    const idMap = new Map([['post-1', 'page_post-post-1']]);
    const doc = {
      _id: 'hero-1',
      _type: 'module_hero',
      featuredPost: { _type: 'reference', _ref: 'post-1' },
    };

    expect(collectRefRewritePatches(doc, idMap)).toEqual(
      patch('hero-1', [at(['featuredPost', '_ref'], set('page_post-post-1'))]),
    );
  });

  it('rewrites every matching reference in module_postFeatured.posts[]', () => {
    const idMap = new Map([
      ['post-1', 'page_post-post-1'],
      ['post-2', 'page_post-post-2'],
    ]);
    const doc = {
      _id: 'featured-1',
      _type: 'module_postFeatured',
      posts: [
        { _type: 'reference', _key: 'a', _ref: 'post-1' },
        { _type: 'reference', _key: 'b', _ref: 'post-2' },
      ],
    };

    expect(collectRefRewritePatches(doc, idMap)).toEqual(
      patch('featured-1', [
        at(['posts', { _key: 'a' }, '_ref'], set('page_post-post-1')),
        at(['posts', { _key: 'b' }, '_ref'], set('page_post-post-2')),
      ]),
    );
  });

  it('rewrites link.internalReference nested inside a Portable Text markDef', () => {
    const idMap = new Map([['post-1', 'page_post-post-1']]);
    const doc = {
      _id: 'cta-1',
      _type: 'module_cta',
      content: [
        {
          _type: 'block',
          _key: 'block-1',
          markDefs: [
            {
              _type: 'link',
              _key: 'mark-1',
              internalReference: { _type: 'reference', _ref: 'post-1' },
            },
          ],
          children: [],
        },
      ],
    };

    expect(collectRefRewritePatches(doc, idMap)).toEqual(
      patch('cta-1', [
        at(
          [
            'content',
            { _key: 'block-1' },
            'markDefs',
            { _key: 'mark-1' },
            'internalReference',
            '_ref',
          ],
          set('page_post-post-1'),
        ),
      ]),
    );
  });

  it('still rewrites other reference fields on a page_post document', () => {
    const idMap = new Map([['post-1', 'page_post-post-1']]);
    const doc = {
      _id: 'page_post-post-2',
      _type: 'page_post',
      author: { _type: 'reference', _ref: 'post-1' },
    };

    expect(collectRefRewritePatches(doc, idMap)).toEqual(
      patch('page_post-post-2', [
        at(['author', '_ref'], set('page_post-post-1')),
      ]),
    );
  });
});
