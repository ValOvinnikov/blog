import { at, patch, set } from 'sanity/migrate';

import { collectRefRewritePatches, rewriteRefsDeep } from './rewrite-refs';

describe('rewriteRefsDeep', () => {
  it('rewrites a top-level reference found in the id map', () => {
    const idMap = new Map([['author-1', 'person-author-1']]);

    expect(
      rewriteRefsDeep({ _type: 'reference', _ref: 'author-1' }, idMap),
    ).toEqual({ _type: 'reference', _ref: 'person-author-1' });
  });

  it('leaves references absent from the id map unchanged', () => {
    const idMap = new Map([['author-1', 'person-author-1']]);

    expect(
      rewriteRefsDeep({ _type: 'reference', _ref: 'topic-1' }, idMap),
    ).toEqual({ _type: 'reference', _ref: 'topic-1' });
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
    const idMap = new Map([['author-1', 'person-author-1']]);
    const doc = { _id: 'doc-1', _type: 'module_hero', title: 'Hero' };

    expect(collectRefRewritePatches(doc, idMap)).toBeUndefined();
  });

  it('rewrites page_post.author (development referrer shape)', () => {
    const idMap = new Map([['author-1', 'person-author-1']]);
    const doc = {
      _id: 'page_post-post-1',
      _type: 'page_post',
      author: { _type: 'reference', _ref: 'author-1' },
    };

    expect(collectRefRewritePatches(doc, idMap)).toEqual(
      patch('page_post-post-1', [
        at(['author', '_ref'], set('person-author-1')),
      ]),
    );
  });

  it('rewrites blog_post.author (production referrer shape)', () => {
    const idMap = new Map([['author-1', 'person-author-1']]);
    const doc = {
      _id: 'post-1',
      _type: 'blog_post',
      author: { _type: 'reference', _ref: 'author-1' },
    };

    expect(collectRefRewritePatches(doc, idMap)).toEqual(
      patch('post-1', [at(['author', '_ref'], set('person-author-1'))]),
    );
  });

  it('rewrites module_heroProfile.author', () => {
    const idMap = new Map([['author-1', 'person-author-1']]);
    const doc = {
      _id: 'hero-profile-1',
      _type: 'module_heroProfile',
      author: { _type: 'reference', _ref: 'author-1' },
    };

    expect(collectRefRewritePatches(doc, idMap)).toEqual(
      patch('hero-profile-1', [at(['author', '_ref'], set('person-author-1'))]),
    );
  });

  it('returns undefined when a reference already points at its mapped person id', () => {
    const idMap = new Map([['author-1', 'person-author-1']]);
    const doc = {
      _id: 'page_post-post-1',
      _type: 'page_post',
      author: { _type: 'reference', _ref: 'person-author-1' },
    };

    expect(collectRefRewritePatches(doc, idMap)).toBeUndefined();
  });
});
