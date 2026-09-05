import {
  BRAND_VARIANT,
  CONTAINER_WIDTH,
  CONTENT_ALIGNMENT,
} from '@blog/config';
import { makeRawPostListModule } from '@blog/service/testing/modules/fixtures';
import { makeTenant } from '@blog/service/testing/tenant';

import { toPostListModule, type TRawPostListModulePosts } from './transformer';

const rawPosts: TRawPostListModulePosts = [];
const pagination = { currentPage: 1, totalPages: 1 };
const tenant = makeTenant();

describe('toPostListModule', () => {
  it('maps sectionHeader straight through', () => {
    const raw = makeRawPostListModule();

    const module = toPostListModule(raw, rawPosts, pagination, tenant);

    expect(module.sectionHeader).toEqual({
      heading: 'Latest',
      supportingText: undefined,
    });
  });

  it('maps brandVariant straight through', () => {
    const raw = makeRawPostListModule({
      brandVariant: BRAND_VARIANT.SECONDARY,
    });

    const module = toPostListModule(raw, rawPosts, pagination, tenant);

    expect(module.brandVariant).toBe(BRAND_VARIANT.SECONDARY);
  });

  it('maps brandVariant straight through, including BRAND_PRIMARY', () => {
    const raw = makeRawPostListModule({
      brandVariant: BRAND_VARIANT.BRAND_PRIMARY,
    });

    const module = toPostListModule(raw, rawPosts, pagination, tenant);

    expect(module.brandVariant).toBe(BRAND_VARIANT.BRAND_PRIMARY);
  });

  it('leaves every sectionHeader field undefined when the field itself is unset (no faked default)', () => {
    const raw = makeRawPostListModule({ sectionHeader: null });

    const module = toPostListModule(raw, rawPosts, pagination, tenant);

    expect(module.sectionHeader).toEqual({
      heading: undefined,
      supportingText: undefined,
    });
  });

  it('leaves contentAlignment undefined when unset (no faked default)', () => {
    const raw = makeRawPostListModule({ contentAlignment: null });

    const module = toPostListModule(raw, rawPosts, pagination, tenant);

    expect(module.contentAlignment).toBeUndefined();
  });

  it('maps contentAlignment when authored', () => {
    const raw = makeRawPostListModule({
      contentAlignment: CONTENT_ALIGNMENT.RIGHT,
    });

    const module = toPostListModule(raw, rawPosts, pagination, tenant);

    expect(module.contentAlignment).toBe(CONTENT_ALIGNMENT.RIGHT);
  });

  it('maps a fully-authored layout object 1:1', () => {
    const raw = makeRawPostListModule({
      layout: {
        spacingTop: 'MD',
        spacingBottom: 'MD',
        containerWidth: CONTAINER_WIDTH.WIDE,
        dividerTop: true,
        dividerBottom: true,
      },
    });

    const module = toPostListModule(raw, rawPosts, pagination, tenant);

    expect(module.layout).toEqual({
      spacingTop: 'MD',
      spacingBottom: 'MD',
      containerWidth: CONTAINER_WIDTH.WIDE,
      dividerTop: true,
      dividerBottom: true,
    });
  });

  it('leaves layout undefined when the field is unset (no faked default)', () => {
    const raw = makeRawPostListModule({ layout: null });

    const module = toPostListModule(raw, rawPosts, pagination, tenant);

    expect(module.layout).toBeUndefined();
  });

  it('maps posts through toPostCard', () => {
    const raw = makeRawPostListModule();

    const module = toPostListModule(raw, rawPosts, pagination, tenant);

    expect(module.posts).toEqual([]);
  });

  it('maps currentPage/totalPages straight through', () => {
    const raw = makeRawPostListModule();

    const module = toPostListModule(
      raw,
      rawPosts,
      {
        currentPage: 2,
        totalPages: 5,
      },
      tenant,
    );

    expect(module.currentPage).toBe(2);
    expect(module.totalPages).toBe(5);
  });
});
