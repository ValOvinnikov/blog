import {
  BRAND_VARIANT,
  CONTAINER_WIDTH,
  CONTENT_ALIGNMENT,
} from '@blog/config';
import { makeRawPostLatestModule } from '@blog/service/testing/modules/fixtures';
import { makeRawPostCard } from '@blog/service/testing/pages/fixtures';
import { makeTenant } from '@blog/service/testing/tenant';

import {
  toPostLatestModule,
  type TRawPostLatestModulePosts,
} from './transformer';

const rawPosts: TRawPostLatestModulePosts = [];
const tenant = makeTenant();

describe('toPostLatestModule', () => {
  it('maps headingBlock straight through', () => {
    const raw = makeRawPostLatestModule();

    const module = toPostLatestModule(raw, rawPosts, tenant);

    expect(module.headingBlock).toEqual({
      heading: 'Latest',
      supportingText: undefined,
    });
  });

  it('maps brandVariant straight through', () => {
    const raw = makeRawPostLatestModule({
      brandVariant: BRAND_VARIANT.SECONDARY,
    });

    const module = toPostLatestModule(raw, rawPosts, tenant);

    expect(module.brandVariant).toBe(BRAND_VARIANT.SECONDARY);
  });

  it('leaves every headingBlock field undefined when the field itself is unset (no faked default)', () => {
    const raw = makeRawPostLatestModule({ headingBlock: null });

    const module = toPostLatestModule(raw, rawPosts, tenant);

    expect(module.headingBlock).toEqual({
      heading: undefined,
      supportingText: undefined,
    });
  });

  it('leaves contentAlignment undefined when unset (no faked default)', () => {
    const raw = makeRawPostLatestModule({ contentAlignment: null });

    const module = toPostLatestModule(raw, rawPosts, tenant);

    expect(module.contentAlignment).toBeUndefined();
  });

  it('maps contentAlignment when authored', () => {
    const raw = makeRawPostLatestModule({
      contentAlignment: CONTENT_ALIGNMENT.RIGHT,
    });

    const module = toPostLatestModule(raw, rawPosts, tenant);

    expect(module.contentAlignment).toBe(CONTENT_ALIGNMENT.RIGHT);
  });

  it('maps a fully-authored layout object 1:1', () => {
    const raw = makeRawPostLatestModule({
      layout: {
        spacingTop: 'MD',
        spacingBottom: 'MD',
        containerWidth: CONTAINER_WIDTH.WIDE,
        dividerTop: true,
        dividerBottom: true,
      },
    });

    const module = toPostLatestModule(raw, rawPosts, tenant);

    expect(module.layout).toEqual({
      spacingTop: 'MD',
      spacingBottom: 'MD',
      containerWidth: CONTAINER_WIDTH.WIDE,
      dividerTop: true,
      dividerBottom: true,
    });
  });

  it('leaves layout undefined when the field is unset (no faked default)', () => {
    const raw = makeRawPostLatestModule({ layout: null });

    const module = toPostLatestModule(raw, rawPosts, tenant);

    expect(module.layout).toBeUndefined();
  });

  it('maps posts through toPostCard', () => {
    const raw = makeRawPostLatestModule();

    const module = toPostLatestModule(
      raw,
      [makeRawPostCard({ _id: 'a' })],
      tenant,
    );

    expect(module.posts.map((p) => p.id)).toEqual(['a']);
  });

  it('returns an empty posts array when nothing resolves', () => {
    const raw = makeRawPostLatestModule();

    const module = toPostLatestModule(raw, rawPosts, tenant);

    expect(module.posts).toEqual([]);
  });

  it('passes showImages through when true', () => {
    const raw = makeRawPostLatestModule({ showImages: true });

    const module = toPostLatestModule(raw, rawPosts, tenant);

    expect(module.showImages).toBe(true);
  });

  it('passes showImages through when false', () => {
    const raw = makeRawPostLatestModule({ showImages: false });

    const module = toPostLatestModule(raw, rawPosts, tenant);

    expect(module.showImages).toBe(false);
  });
});
