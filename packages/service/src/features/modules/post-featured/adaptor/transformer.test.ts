import {
  BRAND_VARIANT,
  CONTAINER_WIDTH,
  CONTENT_ALIGNMENT,
  POST_SOURCE,
} from '@blog/config';
import { makeRawPostFeaturedModule } from '@blog/service/testing/modules/fixtures';
import { makeRawPostCard } from '@blog/service/testing/pages/fixtures';
import { makeTenant } from '@blog/service/testing/tenant';

import { toPostFeaturedModule } from './transformer';

const tenant = makeTenant();

describe(toPostFeaturedModule, () => {
  it('maps sectionHeader straight through', () => {
    const raw = makeRawPostFeaturedModule();

    const module = toPostFeaturedModule(raw, tenant);

    expect(module.sectionHeader).toEqual({
      heading: 'Featured',
      supportingText: undefined,
    });
  });

  it('maps brandVariant straight through', () => {
    const raw = makeRawPostFeaturedModule({
      brandVariant: BRAND_VARIANT.SECONDARY,
    });

    const module = toPostFeaturedModule(raw, tenant);

    expect(module.brandVariant).toBe(BRAND_VARIANT.SECONDARY);
  });

  it('leaves every sectionHeader field undefined when the field itself is unset (no faked default)', () => {
    const raw = makeRawPostFeaturedModule({ sectionHeader: null });

    const module = toPostFeaturedModule(raw, tenant);

    expect(module.sectionHeader).toEqual({
      heading: undefined,
      supportingText: undefined,
    });
  });

  it('leaves contentAlignment undefined when unset (no faked default)', () => {
    const raw = makeRawPostFeaturedModule({ contentAlignment: null });

    const module = toPostFeaturedModule(raw, tenant);

    expect(module.contentAlignment).toBeUndefined();
  });

  it('maps contentAlignment when authored', () => {
    const raw = makeRawPostFeaturedModule({
      contentAlignment: CONTENT_ALIGNMENT.RIGHT,
    });

    const module = toPostFeaturedModule(raw, tenant);

    expect(module.contentAlignment).toBe(CONTENT_ALIGNMENT.RIGHT);
  });

  it('maps a fully-authored layout object 1:1', () => {
    const raw = makeRawPostFeaturedModule({
      layout: {
        spacingTop: 'MD',
        spacingBottom: 'MD',
        containerWidth: CONTAINER_WIDTH.WIDE,
        dividerTop: true,
        dividerBottom: true,
      },
    });

    const module = toPostFeaturedModule(raw, tenant);

    expect(module.layout).toEqual({
      spacingTop: 'MD',
      spacingBottom: 'MD',
      containerWidth: CONTAINER_WIDTH.WIDE,
      dividerTop: true,
      dividerBottom: true,
    });
  });

  it('leaves layout undefined when the field is unset (no faked default)', () => {
    const raw = makeRawPostFeaturedModule({ layout: null });

    const module = toPostFeaturedModule(raw, tenant);

    expect(module.layout).toBeUndefined();
  });

  it('preserves authored order for pinned posts (first is the lead, nothing re-sorted)', () => {
    const raw = makeRawPostFeaturedModule({
      postSource: POST_SOURCE.PINNED,
      posts: [
        makeRawPostCard({ _id: 'b', publishedAt: '2026-01-01T00:00:00Z' }),
        makeRawPostCard({ _id: 'a', publishedAt: '2026-02-01T00:00:00Z' }),
      ],
    });

    const module = toPostFeaturedModule(raw, tenant);

    expect(module.posts.map((p) => p.id)).toEqual(['b', 'a']);
  });

  it('reflects a pin the query already dropped for being unpublished', () => {
    const raw = makeRawPostFeaturedModule({
      postSource: POST_SOURCE.PINNED,
      posts: [makeRawPostCard({ _id: 'a' }), makeRawPostCard({ _id: 'c' })],
    });

    const module = toPostFeaturedModule(raw, tenant);

    expect(module.posts.map((p) => p.id)).toEqual(['a', 'c']);
  });

  it('does not cut pinned posts by a lingering limit value', () => {
    const raw = makeRawPostFeaturedModule({
      postSource: POST_SOURCE.PINNED,
      limit: 1,
      posts: [makeRawPostCard({ _id: 'a' }), makeRawPostCard({ _id: 'b' })],
    });

    const module = toPostFeaturedModule(raw, tenant);

    expect(module.posts.map((p) => p.id)).toEqual(['a', 'b']);
  });

  it('cuts the newest-featured source to a limit of 1', () => {
    const raw = makeRawPostFeaturedModule({
      postSource: POST_SOURCE.NEWEST_FEATURED,
      limit: 1,
      posts: [
        makeRawPostCard({ _id: 'a' }),
        makeRawPostCard({ _id: 'b' }),
        makeRawPostCard({ _id: 'c' }),
      ],
    });

    const module = toPostFeaturedModule(raw, tenant);

    expect(module.posts.map((p) => p.id)).toEqual(['a']);
  });

  it('cuts the newest-featured source to a limit of 3', () => {
    const raw = makeRawPostFeaturedModule({
      postSource: POST_SOURCE.NEWEST_FEATURED,
      limit: 3,
      posts: [
        makeRawPostCard({ _id: 'a' }),
        makeRawPostCard({ _id: 'b' }),
        makeRawPostCard({ _id: 'c' }),
      ],
    });

    const module = toPostFeaturedModule(raw, tenant);

    expect(module.posts.map((p) => p.id)).toEqual(['a', 'b', 'c']);
  });

  it('returns an empty posts array when nothing is featured in the dataset', () => {
    const raw = makeRawPostFeaturedModule({
      postSource: POST_SOURCE.NEWEST_FEATURED,
      limit: 3,
      posts: [],
    });

    const module = toPostFeaturedModule(raw, tenant);

    expect(module.posts).toEqual([]);
  });

  it('passes showImages through when true', () => {
    const raw = makeRawPostFeaturedModule({ showImages: true });

    const module = toPostFeaturedModule(raw, tenant);

    expect(module.showImages).toBe(true);
  });

  it('passes showImages through when false', () => {
    const raw = makeRawPostFeaturedModule({ showImages: false });

    const module = toPostFeaturedModule(raw, tenant);

    expect(module.showImages).toBe(false);
  });
});
