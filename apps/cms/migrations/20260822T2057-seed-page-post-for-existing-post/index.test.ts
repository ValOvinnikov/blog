import { pagePostSchema } from '@cms/schema-types/documents/pages/page-post';
import { assertSatisfiesRequiredFields } from '@cms/testing/assert-satisfies-required-fields';
import { createIfNotExists } from 'sanity/migrate';

import { toPagePostId } from './id';

import migration from './index';

const baseDoc = {
  _createdAt: '2026-01-01T00:00:00Z',
  _updatedAt: '2026-01-01T00:00:00Z',
  _rev: 'rev-1',
};

const postDoc = {
  ...baseDoc,
  _id: 'abc123',
  _type: 'blog_post',
  title: 'Understanding GROQ',
  slug: { _type: 'slug', current: 'understanding-groq' },
  publishedAt: '2026-02-01T09:00:00Z',
};

describe('seed-page-post-for-existing-post migration', () => {
  it('creates a page_post referencing the post and copying its slug/publishedAt', () => {
    const pagePostId = toPagePostId(postDoc._id);

    const pagePostPayload = {
      _id: pagePostId,
      _type: 'page_post',
      title: 'Understanding GROQ Post Page',
      slug: { _type: 'slug', current: 'understanding-groq' },
      post: { _type: 'reference', _ref: postDoc._id },
      publishedAt: '2026-02-01T09:00:00Z',
    };

    assertSatisfiesRequiredFields(pagePostSchema, pagePostPayload);

    expect(migration.migrate.document(postDoc)).toEqual([
      createIfNotExists(pagePostPayload),
    ]);
  });

  it('skips a drafts.blog_post document, so the page is not created twice', () => {
    const draftDoc = { ...postDoc, _id: `drafts.${postDoc._id}` };

    expect(migration.migrate.document(draftDoc)).toBeUndefined();
  });

  it('is idempotent — a second run against the same post returns the same createIfNotExists mutation', () => {
    expect(migration.migrate.document(postDoc)).toEqual(
      migration.migrate.document(postDoc),
    );
  });

  it('preserves the exact slug and publishedAt values from blog_post, unmodified', () => {
    const otherDoc = {
      ...postDoc,
      _id: 'xyz789',
      title: 'Advanced TypeScript',
      slug: { _type: 'slug', current: 'advanced-typescript' },
      publishedAt: '2026-03-15T12:30:00Z',
    };

    const [mutation] = migration.migrate.document(otherDoc)!;

    const pagePostPayload = {
      _id: toPagePostId(otherDoc._id),
      _type: 'page_post',
      title: 'Advanced TypeScript Post Page',
      slug: { _type: 'slug', current: 'advanced-typescript' },
      post: { _type: 'reference', _ref: otherDoc._id },
      publishedAt: '2026-03-15T12:30:00Z',
    };

    assertSatisfiesRequiredFields(pagePostSchema, pagePostPayload);

    expect(mutation).toEqual(createIfNotExists(pagePostPayload));
  });
});
