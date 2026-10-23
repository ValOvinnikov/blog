import {
  BRAND_VARIANT,
  CONTENT_ALIGNMENT,
  TAXONOMY_KIND,
  TAXONOMY_SORT,
} from '@blog/config/constants';
import {
  MOCK_TAG_ID,
  MOCK_TAG_TITLE,
  MOCK_TOPIC_DESCRIPTION,
  MOCK_TOPIC_ID,
  MOCK_TOPIC_SLUG,
  MOCK_TOPIC_TITLE,
} from '@blog/service/testing/entities/fixtures';
import {
  mockRawTaxonomyEntry,
  mockRawTaxonomyListModule,
} from '@blog/service/testing/modules/fixtures';
import { MOCK_TOPIC_INDEX_HEADING } from '@blog/service/testing/pages/fixtures';
import {
  MOCK_POST_ID,
  mockRawHeadingBlock,
  mockRawPostLink,
  mockRawWideLayout,
} from '@blog/service/testing/shared/fixtures';

import { toTaxonomyListModule } from './transformer';

const SUPPORTING_TEXT = 'Pick a subject.';
const ALPHA = 'Alpha';
const BETA = 'Beta';
const NEWER_POST_TITLE = 'Newer post';
const NEWER_POST_SLUG = 'newer-post';
const OLDER_POST_TITLE = 'Older post';
const OLDER_POST_SLUG = 'older-post';
const LAYOUT = mockRawWideLayout();
const ALPHA_BETA_ENTRIES = [
  mockRawTaxonomyEntry({ _id: MOCK_TOPIC_ID, title: ALPHA }),
  mockRawTaxonomyEntry({ _id: 'topic-2', title: BETA }),
];

describe(toTaxonomyListModule, () => {
  it('maps brandVariant straight through', () => {
    const raw = mockRawTaxonomyListModule({
      brandVariant: BRAND_VARIANT.SECONDARY,
    });

    const module = toTaxonomyListModule(raw);

    expect(module.brandVariant).toBe(BRAND_VARIANT.SECONDARY);
  });

  it('maps headingBlock when authored', () => {
    const raw = mockRawTaxonomyListModule({
      headingBlock: mockRawHeadingBlock(MOCK_TOPIC_INDEX_HEADING, {
        supportingText: SUPPORTING_TEXT,
      }),
    });

    const module = toTaxonomyListModule(raw);

    expect(module.headingBlock).toEqual({
      heading: MOCK_TOPIC_INDEX_HEADING,
      supportingText: SUPPORTING_TEXT,
    });
  });

  it.each([
    [null, undefined],
    [CONTENT_ALIGNMENT.CENTER, CONTENT_ALIGNMENT.CENTER],
  ])('maps a contentAlignment of %s to %s', (contentAlignment, expected) => {
    const raw = mockRawTaxonomyListModule({ contentAlignment });

    const module = toTaxonomyListModule(raw);

    expect(module.contentAlignment).toBe(expected);
  });

  it.each([
    ['a fully-authored layout 1:1', LAYOUT, LAYOUT],
    ['an unset layout to undefined', null, undefined],
  ])('maps %s', (_case, layout, expected) => {
    const raw = mockRawTaxonomyListModule({ layout });

    const module = toTaxonomyListModule(raw);

    expect(module.layout).toEqual(expected);
  });

  it.each([
    [TAXONOMY_KIND.TOPICS, MOCK_TOPIC_ID, MOCK_TOPIC_TITLE],
    [TAXONOMY_KIND.TAGS, MOCK_TAG_ID, MOCK_TAG_TITLE],
  ])(
    'maps the entries when the resolved taxonomy is %s',
    (taxonomy, id, title) => {
      const raw = mockRawTaxonomyListModule({
        taxonomy,
        entries: [mockRawTaxonomyEntry({ _id: id, title })],
      });

      const module = toTaxonomyListModule(raw);

      expect(module.taxonomy).toBe(taxonomy);
      expect(module.entries).toEqual([
        {
          id,
          title,
          slug: MOCK_TOPIC_SLUG,
          description: MOCK_TOPIC_DESCRIPTION,
          postCount: 0,
          latestPosts: [],
        },
      ]);
    },
  );

  it('degrades to an empty module when no taxonomy is authored', () => {
    const raw = mockRawTaxonomyListModule({ taxonomy: null, entries: null });

    const module = toTaxonomyListModule(raw);

    expect(module.taxonomy).toBeUndefined();
    expect(module.entries).toEqual([]);
  });

  it('keeps ALPHABETICAL order as returned by the query', () => {
    const raw = mockRawTaxonomyListModule({
      taxonomy: TAXONOMY_KIND.TOPICS,
      sortOrder: TAXONOMY_SORT.ALPHABETICAL,
      entries: ALPHA_BETA_ENTRIES,
    });

    const module = toTaxonomyListModule(raw);

    expect(module.entries.map((entry) => entry.title)).toEqual([ALPHA, BETA]);
  });

  it('orders MOST_POSTS by postCount descending, ties by title ascending', () => {
    const raw = mockRawTaxonomyListModule({
      taxonomy: TAXONOMY_KIND.TOPICS,
      sortOrder: TAXONOMY_SORT.MOST_POSTS,
      entries: [
        mockRawTaxonomyEntry({ _id: MOCK_TOPIC_ID, title: BETA, postCount: 3 }),
        mockRawTaxonomyEntry({ _id: 'topic-2', title: 'Gamma', postCount: 5 }),
        mockRawTaxonomyEntry({ _id: 'topic-3', title: ALPHA, postCount: 3 }),
      ],
    });

    const module = toTaxonomyListModule(raw);

    expect(module.entries.map((entry) => entry.title)).toEqual([
      'Gamma',
      ALPHA,
      BETA,
    ]);
  });

  it.each([
    [1, [ALPHA]],
    [null, [ALPHA, BETA]],
  ])('cuts the entries to a limit of %s', (limit, titles) => {
    const raw = mockRawTaxonomyListModule({
      taxonomy: TAXONOMY_KIND.TOPICS,
      limit,
      entries: ALPHA_BETA_ENTRIES,
    });

    const module = toTaxonomyListModule(raw);

    expect(module.entries.map((entry) => entry.title)).toEqual(titles);
  });

  it('maps the latest posts per entry, newest first as returned by the query', () => {
    const raw = mockRawTaxonomyListModule({
      taxonomy: TAXONOMY_KIND.TOPICS,
      entries: [
        mockRawTaxonomyEntry({
          _id: MOCK_TOPIC_ID,
          latestPosts: [
            mockRawPostLink({
              _id: 'post-2',
              headingBlock: { heading: NEWER_POST_TITLE },
              slug: NEWER_POST_SLUG,
            }),
            mockRawPostLink({
              _id: MOCK_POST_ID,
              headingBlock: { heading: OLDER_POST_TITLE },
              slug: OLDER_POST_SLUG,
            }),
          ],
        }),
      ],
    });

    const module = toTaxonomyListModule(raw);

    expect(module.entries[0]?.latestPosts).toEqual([
      { id: 'post-2', title: NEWER_POST_TITLE, slug: NEWER_POST_SLUG },
      { id: MOCK_POST_ID, title: OLDER_POST_TITLE, slug: OLDER_POST_SLUG },
    ]);
  });

  it.each([true, false])(
    'passes showLatestPosts %s through',
    (showLatestPosts) => {
      const raw = mockRawTaxonomyListModule({ showLatestPosts });

      const module = toTaxonomyListModule(raw);

      expect(module.showLatestPosts).toBe(showLatestPosts);
    },
  );
});
