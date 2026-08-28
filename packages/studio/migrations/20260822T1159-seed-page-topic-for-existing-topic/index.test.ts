import { pageTopicSchema } from '@blog/studio/schema-types/documents/pages/page-topic';
import { postListSchema } from '@blog/studio/schema-types/modules/module-post-list';
import { assertSatisfiesRequiredFields } from '@blog/studio/testing/assert-satisfies-required-fields';
import { createIfNotExists } from 'sanity/migrate';

import { toPageTopicId, toTopicPostListId } from './id';

import migration from './index';

const baseDoc = {
  _createdAt: '2026-01-01T00:00:00Z',
  _updatedAt: '2026-01-01T00:00:00Z',
  _rev: 'rev-1',
};

const topicDoc = {
  ...baseDoc,
  _id: 'abc123',
  _type: 'blog_topic',
  title: 'React',
  slug: { _type: 'slug', current: 'react' },
};

describe('seed-page-topic-for-existing-topic migration', () => {
  it('creates a module_postList and a page_topic referencing the topic and copying its slug', () => {
    const postListId = toTopicPostListId(topicDoc._id);
    const pageTopicId = toPageTopicId(topicDoc._id);

    const postListPayload = {
      _id: postListId,
      _type: 'module_postList',
      title: 'React Archive',
      brandVariant: 'PRIMARY',
      limit: 9,
      pageSize: 9,
    };
    const pageTopicPayload = {
      _id: pageTopicId,
      _type: 'page_topic',
      title: 'React Topic Page',
      slug: { _type: 'slug', current: 'react' },
      topic: { _type: 'reference', _ref: topicDoc._id },
      postList: { _type: 'reference', _ref: postListId },
    };

    assertSatisfiesRequiredFields(postListSchema, postListPayload);
    assertSatisfiesRequiredFields(pageTopicSchema, pageTopicPayload);

    expect(migration.migrate.document(topicDoc)).toEqual([
      createIfNotExists(postListPayload),
      createIfNotExists(pageTopicPayload),
    ]);
  });

  it('skips a drafts.blog_topic document, so the pair is not created twice', () => {
    const draftDoc = { ...topicDoc, _id: `drafts.${topicDoc._id}` };

    expect(migration.migrate.document(draftDoc)).toBeUndefined();
  });

  it('is idempotent — a second run against the same topic returns the same createIfNotExists mutations', () => {
    expect(migration.migrate.document(topicDoc)).toEqual(
      migration.migrate.document(topicDoc),
    );
  });

  it('preserves the exact slug value from blog_topic, unmodified', () => {
    const otherSlugDoc = {
      ...topicDoc,
      _id: 'xyz789',
      title: 'TypeScript',
      slug: { _type: 'slug', current: 'typescript' },
    };

    const [, pageTopicMutation] = migration.migrate.document(otherSlugDoc)!;

    const pageTopicPayload = {
      _id: toPageTopicId(otherSlugDoc._id),
      _type: 'page_topic',
      title: 'TypeScript Topic Page',
      slug: { _type: 'slug', current: 'typescript' },
      topic: { _type: 'reference', _ref: otherSlugDoc._id },
      postList: {
        _type: 'reference',
        _ref: toTopicPostListId(otherSlugDoc._id),
      },
    };

    assertSatisfiesRequiredFields(pageTopicSchema, pageTopicPayload);

    expect(pageTopicMutation).toEqual(createIfNotExists(pageTopicPayload));
  });
});
