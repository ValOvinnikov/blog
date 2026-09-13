import {
  BRAND_VARIANT,
  CONTAINER_WIDTH,
  CONTENT_ALIGNMENT,
  TAXONOMY_KIND,
  TAXONOMY_SORT,
} from '@blog/config';
import {
  makeRawTaxonomyEntry,
  makeRawTaxonomyListModule,
} from '@blog/service/testing/modules/fixtures';
import {
  makeRawHeadingBlock,
  makeRawPostLink,
} from '@blog/service/testing/shared/fixtures';

import { toTaxonomyListModule } from './transformer';

describe('toTaxonomyListModule', () => {
  it('maps brandVariant straight through', () => {
    const raw = makeRawTaxonomyListModule({
      brandVariant: BRAND_VARIANT.SECONDARY,
    });

    const module = toTaxonomyListModule(raw);

    expect(module.brandVariant).toBe(BRAND_VARIANT.SECONDARY);
  });

  it('maps headingBlock when authored', () => {
    const raw = makeRawTaxonomyListModule({
      headingBlock: makeRawHeadingBlock('Browse by topic', {
        supportingText: 'Pick a subject.',
      }),
    });

    const module = toTaxonomyListModule(raw);

    expect(module.headingBlock).toEqual({
      heading: 'Browse by topic',
      supportingText: 'Pick a subject.',
    });
  });

  it('leaves contentAlignment undefined when unset (no faked default)', () => {
    const raw = makeRawTaxonomyListModule({ contentAlignment: null });

    const module = toTaxonomyListModule(raw);

    expect(module.contentAlignment).toBeUndefined();
  });

  it('maps contentAlignment when authored', () => {
    const raw = makeRawTaxonomyListModule({
      contentAlignment: CONTENT_ALIGNMENT.CENTER,
    });

    const module = toTaxonomyListModule(raw);

    expect(module.contentAlignment).toBe(CONTENT_ALIGNMENT.CENTER);
  });

  it('maps a fully-authored layout object 1:1', () => {
    const raw = makeRawTaxonomyListModule({
      layout: {
        spacingTop: 'MD',
        spacingBottom: 'MD',
        containerWidth: CONTAINER_WIDTH.WIDE,
        dividerTop: true,
        dividerBottom: true,
      },
    });

    const module = toTaxonomyListModule(raw);

    expect(module.layout).toEqual({
      spacingTop: 'MD',
      spacingBottom: 'MD',
      containerWidth: CONTAINER_WIDTH.WIDE,
      dividerTop: true,
      dividerBottom: true,
    });
  });

  it('leaves layout undefined when unset (no faked default)', () => {
    const raw = makeRawTaxonomyListModule({ layout: null });

    const module = toTaxonomyListModule(raw);

    expect(module.layout).toBeUndefined();
  });

  it('maps topic entries when the resolved taxonomy is TOPICS', () => {
    const raw = makeRawTaxonomyListModule({
      taxonomy: TAXONOMY_KIND.TOPICS,
      entries: [makeRawTaxonomyEntry({ _id: 'topic-1', title: 'Engineering' })],
    });

    const module = toTaxonomyListModule(raw);

    expect(module.taxonomy).toBe(TAXONOMY_KIND.TOPICS);
    expect(module.entries).toEqual([
      {
        id: 'topic-1',
        title: 'Engineering',
        slug: 'engineering',
        description: 'Engineering posts',
        postCount: 0,
        latestPosts: [],
      },
    ]);
  });

  it('maps tag entries when the resolved taxonomy is TAGS', () => {
    const raw = makeRawTaxonomyListModule({
      taxonomy: TAXONOMY_KIND.TAGS,
      entries: [makeRawTaxonomyEntry({ _id: 'tag-1', title: 'TypeScript' })],
    });

    const module = toTaxonomyListModule(raw);

    expect(module.taxonomy).toBe(TAXONOMY_KIND.TAGS);
    expect(module.entries).toEqual([
      {
        id: 'tag-1',
        title: 'TypeScript',
        slug: 'engineering',
        description: 'Engineering posts',
        postCount: 0,
        latestPosts: [],
      },
    ]);
  });

  it('throws when the taxonomy is unresolved', () => {
    const raw = makeRawTaxonomyListModule({ taxonomy: null, entries: null });

    expect(() => toTaxonomyListModule(raw)).toThrow(
      'module_taxonomyList has no resolvable taxonomy',
    );
  });

  it('keeps ALPHABETICAL order as returned by the query', () => {
    const raw = makeRawTaxonomyListModule({
      taxonomy: TAXONOMY_KIND.TOPICS,
      sortOrder: TAXONOMY_SORT.ALPHABETICAL,
      entries: [
        makeRawTaxonomyEntry({ _id: 'topic-1', title: 'Alpha' }),
        makeRawTaxonomyEntry({ _id: 'topic-2', title: 'Beta' }),
      ],
    });

    const module = toTaxonomyListModule(raw);

    expect(module.entries.map((entry) => entry.title)).toEqual([
      'Alpha',
      'Beta',
    ]);
  });

  it('orders MOST_POSTS by postCount descending, ties broken by title ascending', () => {
    const raw = makeRawTaxonomyListModule({
      taxonomy: TAXONOMY_KIND.TOPICS,
      sortOrder: TAXONOMY_SORT.MOST_POSTS,
      entries: [
        makeRawTaxonomyEntry({
          _id: 'topic-1',
          title: 'Beta',
          postCount: 3,
        }),
        makeRawTaxonomyEntry({
          _id: 'topic-2',
          title: 'Gamma',
          postCount: 5,
        }),
        makeRawTaxonomyEntry({
          _id: 'topic-3',
          title: 'Alpha',
          postCount: 3,
        }),
      ],
    });

    const module = toTaxonomyListModule(raw);

    expect(module.entries.map((entry) => entry.title)).toEqual([
      'Gamma',
      'Alpha',
      'Beta',
    ]);
  });

  it('cuts entries to limit when authored', () => {
    const raw = makeRawTaxonomyListModule({
      taxonomy: TAXONOMY_KIND.TOPICS,
      limit: 1,
      entries: [
        makeRawTaxonomyEntry({ _id: 'topic-1', title: 'Alpha' }),
        makeRawTaxonomyEntry({ _id: 'topic-2', title: 'Beta' }),
      ],
    });

    const module = toTaxonomyListModule(raw);

    expect(module.entries).toHaveLength(1);
    expect(module.entries[0]?.title).toBe('Alpha');
  });

  it('does not cut entries when limit is unset', () => {
    const raw = makeRawTaxonomyListModule({
      taxonomy: TAXONOMY_KIND.TOPICS,
      limit: null,
      entries: [
        makeRawTaxonomyEntry({ _id: 'topic-1', title: 'Alpha' }),
        makeRawTaxonomyEntry({ _id: 'topic-2', title: 'Beta' }),
      ],
    });

    const module = toTaxonomyListModule(raw);

    expect(module.entries).toHaveLength(2);
  });

  it('maps two latest posts per entry, newest first as returned by the query', () => {
    const raw = makeRawTaxonomyListModule({
      taxonomy: TAXONOMY_KIND.TOPICS,
      entries: [
        makeRawTaxonomyEntry({
          _id: 'topic-1',
          latestPosts: [
            makeRawPostLink({
              _id: 'post-2',
              headingBlock: { heading: 'Newer post' },
              slug: 'newer-post',
            }),
            makeRawPostLink({
              _id: 'post-1',
              headingBlock: { heading: 'Older post' },
              slug: 'older-post',
            }),
          ],
        }),
      ],
    });

    const module = toTaxonomyListModule(raw);

    expect(module.entries[0]?.latestPosts).toEqual([
      { id: 'post-2', title: 'Newer post', slug: 'newer-post' },
      { id: 'post-1', title: 'Older post', slug: 'older-post' },
    ]);
  });

  it('maps a single latest post per entry', () => {
    const raw = makeRawTaxonomyListModule({
      taxonomy: TAXONOMY_KIND.TOPICS,
      entries: [
        makeRawTaxonomyEntry({
          _id: 'topic-1',
          latestPosts: [makeRawPostLink({ _id: 'post-1' })],
        }),
      ],
    });

    const module = toTaxonomyListModule(raw);

    expect(module.entries[0]?.latestPosts).toHaveLength(1);
  });

  it('leaves latestPosts empty for a term with no posts', () => {
    const raw = makeRawTaxonomyListModule({
      taxonomy: TAXONOMY_KIND.TOPICS,
      entries: [makeRawTaxonomyEntry({ _id: 'topic-1', latestPosts: [] })],
    });

    const module = toTaxonomyListModule(raw);

    expect(module.entries[0]?.latestPosts).toEqual([]);
  });

  it('passes showLatestPosts through when authored false', () => {
    const raw = makeRawTaxonomyListModule({ showLatestPosts: false });

    const module = toTaxonomyListModule(raw);

    expect(module.showLatestPosts).toBe(false);
  });

  it('passes showLatestPosts through when authored true', () => {
    const raw = makeRawTaxonomyListModule({ showLatestPosts: true });

    const module = toTaxonomyListModule(raw);

    expect(module.showLatestPosts).toBe(true);
  });
});
