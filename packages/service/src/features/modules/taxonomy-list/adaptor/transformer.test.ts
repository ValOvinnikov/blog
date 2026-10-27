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
import { faker } from '@faker-js/faker';

import { toTaxonomyListModule } from './transformer';

faker.seed(6014);

const [MOCK_FIRST_TITLE, MOCK_SECOND_TITLE, MOCK_THIRD_TITLE] = faker.helpers
  .uniqueArray(faker.lorem.word, 3)
  .sort((a, b) => a.localeCompare(b));
const MOCK_SUPPORTING_TEXT = faker.lorem.sentence();
const MOCK_SECOND_TOPIC_ID = faker.string.uuid();
const MOCK_THIRD_TOPIC_ID = faker.string.uuid();
const MOCK_NEWER_POST_ID = faker.string.uuid();
const MOCK_NEWER_POST_TITLE = faker.lorem.words(3);
const MOCK_NEWER_POST_SLUG = faker.lorem.slug();
const MOCK_OLDER_POST_TITLE = faker.lorem.words(3);
const MOCK_OLDER_POST_SLUG = faker.lorem.slug();
const MOCK_LAYOUT = mockRawWideLayout();
const MOCK_FIRST_SECOND_ENTRIES = [
  mockRawTaxonomyEntry({ _id: MOCK_TOPIC_ID, title: MOCK_FIRST_TITLE }),
  mockRawTaxonomyEntry({ _id: MOCK_SECOND_TOPIC_ID, title: MOCK_SECOND_TITLE }),
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
        supportingText: MOCK_SUPPORTING_TEXT,
      }),
    });

    const module = toTaxonomyListModule(raw);

    expect(module.headingBlock).toEqual({
      heading: MOCK_TOPIC_INDEX_HEADING,
      supportingText: MOCK_SUPPORTING_TEXT,
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
    ['a fully-authored layout 1:1', MOCK_LAYOUT, MOCK_LAYOUT],
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

  it('keeps the alphabetical order the query returned', () => {
    const raw = mockRawTaxonomyListModule({
      taxonomy: TAXONOMY_KIND.TOPICS,
      sortOrder: TAXONOMY_SORT.ALPHABETICAL,
      entries: MOCK_FIRST_SECOND_ENTRIES,
    });

    const module = toTaxonomyListModule(raw);

    expect(module.entries.map((entry) => entry.title)).toEqual([
      MOCK_FIRST_TITLE,
      MOCK_SECOND_TITLE,
    ]);
  });

  it('orders most-posts by count descending, ties by title ascending', () => {
    const raw = mockRawTaxonomyListModule({
      taxonomy: TAXONOMY_KIND.TOPICS,
      sortOrder: TAXONOMY_SORT.MOST_POSTS,
      entries: [
        mockRawTaxonomyEntry({
          _id: MOCK_TOPIC_ID,
          title: MOCK_SECOND_TITLE,
          postCount: 3,
        }),
        mockRawTaxonomyEntry({
          _id: MOCK_SECOND_TOPIC_ID,
          title: MOCK_THIRD_TITLE,
          postCount: 5,
        }),
        mockRawTaxonomyEntry({
          _id: MOCK_THIRD_TOPIC_ID,
          title: MOCK_FIRST_TITLE,
          postCount: 3,
        }),
      ],
    });

    const module = toTaxonomyListModule(raw);

    expect(module.entries.map((entry) => entry.title)).toEqual([
      MOCK_THIRD_TITLE,
      MOCK_FIRST_TITLE,
      MOCK_SECOND_TITLE,
    ]);
  });

  it.each([
    [1, [MOCK_FIRST_TITLE]],
    [null, [MOCK_FIRST_TITLE, MOCK_SECOND_TITLE]],
  ])('cuts the entries to a limit of %s', (limit, titles) => {
    const raw = mockRawTaxonomyListModule({
      taxonomy: TAXONOMY_KIND.TOPICS,
      limit,
      entries: MOCK_FIRST_SECOND_ENTRIES,
    });

    const module = toTaxonomyListModule(raw);

    expect(module.entries.map((entry) => entry.title)).toEqual(titles);
  });

  it('maps each entry latest posts, newest first as the query returned them', () => {
    const raw = mockRawTaxonomyListModule({
      taxonomy: TAXONOMY_KIND.TOPICS,
      entries: [
        mockRawTaxonomyEntry({
          _id: MOCK_TOPIC_ID,
          latestPosts: [
            mockRawPostLink({
              _id: MOCK_NEWER_POST_ID,
              headingBlock: { heading: MOCK_NEWER_POST_TITLE },
              slug: MOCK_NEWER_POST_SLUG,
            }),
            mockRawPostLink({
              _id: MOCK_POST_ID,
              headingBlock: { heading: MOCK_OLDER_POST_TITLE },
              slug: MOCK_OLDER_POST_SLUG,
            }),
          ],
        }),
      ],
    });

    const module = toTaxonomyListModule(raw);

    expect(module.entries[0]?.latestPosts).toEqual([
      {
        id: MOCK_NEWER_POST_ID,
        title: MOCK_NEWER_POST_TITLE,
        slug: MOCK_NEWER_POST_SLUG,
      },
      {
        id: MOCK_POST_ID,
        title: MOCK_OLDER_POST_TITLE,
        slug: MOCK_OLDER_POST_SLUG,
      },
    ]);
  });

  it.each([true, false])(
    'passes the show-latest-posts flag %s through',
    (showLatestPosts) => {
      const raw = mockRawTaxonomyListModule({ showLatestPosts });

      const module = toTaxonomyListModule(raw);

      expect(module.showLatestPosts).toBe(showLatestPosts);
    },
  );
});
