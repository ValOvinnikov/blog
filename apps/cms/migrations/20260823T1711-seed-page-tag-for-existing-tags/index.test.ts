import { pageTagSchema } from '@cms/schema-types/documents/pages/page-tag';
import { postListSchema } from '@cms/schema-types/modules/module-post-list';
import { assertSatisfiesRequiredFields } from '@cms/testing/assert-satisfies-required-fields';
import { createIfNotExists } from 'sanity/migrate';

import { toPageTagId, toTagPostListId } from './id';

import migration from './index';

const baseDoc = {
  _createdAt: '2026-01-01T00:00:00Z',
  _updatedAt: '2026-01-01T00:00:00Z',
  _rev: 'rev-1',
};

const tagDoc = {
  ...baseDoc,
  _id: 'abc123',
  _type: 'blog_tag',
  title: 'React',
  slug: { _type: 'slug', current: 'react' },
};

describe('seed-page-tag-for-existing-tags migration', () => {
  it('creates a module_postList and a page_tag referencing the tag and copying its slug', () => {
    const postListId = toTagPostListId(tagDoc._id);
    const pageTagId = toPageTagId(tagDoc._id);

    const postListPayload = {
      _id: postListId,
      _type: 'module_postList',
      title: 'React Archive',
      brandVariant: 'SECONDARY',
      limit: 9,
      pageSize: 9,
    };
    const pageTagPayload = {
      _id: pageTagId,
      _type: 'page_tag',
      title: 'React Tag Page',
      slug: { _type: 'slug', current: 'react' },
      tag: { _type: 'reference', _ref: tagDoc._id },
      postList: { _type: 'reference', _ref: postListId },
    };

    assertSatisfiesRequiredFields(postListSchema, postListPayload);
    assertSatisfiesRequiredFields(pageTagSchema, pageTagPayload);

    expect(migration.migrate.document(tagDoc)).toEqual([
      createIfNotExists(postListPayload),
      createIfNotExists(pageTagPayload),
    ]);
  });

  it('skips a drafts.blog_tag document, so the pair is not created twice', () => {
    const draftDoc = { ...tagDoc, _id: `drafts.${tagDoc._id}` };

    expect(migration.migrate.document(draftDoc)).toBeUndefined();
  });

  it('is idempotent — a second run against the same tag returns the same createIfNotExists mutations', () => {
    expect(migration.migrate.document(tagDoc)).toEqual(
      migration.migrate.document(tagDoc),
    );
  });

  it('preserves the exact slug value from blog_tag, unmodified', () => {
    const otherSlugDoc = {
      ...tagDoc,
      _id: 'xyz789',
      title: 'TypeScript',
      slug: { _type: 'slug', current: 'typescript' },
    };

    const [, pageTagMutation] = migration.migrate.document(otherSlugDoc)!;

    const pageTagPayload = {
      _id: toPageTagId(otherSlugDoc._id),
      _type: 'page_tag',
      title: 'TypeScript Tag Page',
      slug: { _type: 'slug', current: 'typescript' },
      tag: { _type: 'reference', _ref: otherSlugDoc._id },
      postList: {
        _type: 'reference',
        _ref: toTagPostListId(otherSlugDoc._id),
      },
    };

    assertSatisfiesRequiredFields(pageTagSchema, pageTagPayload);

    expect(pageTagMutation).toEqual(createIfNotExists(pageTagPayload));
  });
});
