import { BRAND_VARIANT, CONTAINER_WIDTH, HEADING_ALIGN } from '@blog/config';
import { makeRawPostListModule } from '@blog/service/testing/modules/fixtures';

import { toPostListModule, type TRawPostListModulePosts } from './transformer';

const rawPosts: TRawPostListModulePosts = [];
const pagination = { currentPage: 1, totalPages: 1 };

describe('toPostListModule', () => {
  it('maps sectionHeader straight through', () => {
    const raw = makeRawPostListModule();

    const module = toPostListModule(raw, rawPosts, pagination);

    expect(module.sectionHeader).toEqual({
      heading: 'Latest',
      supportingText: undefined,
      align: undefined,
    });
  });

  it('maps brandVariant straight through', () => {
    const raw = makeRawPostListModule({
      brandVariant: BRAND_VARIANT.SECONDARY,
    });

    const module = toPostListModule(raw, rawPosts, pagination);

    expect(module.brandVariant).toBe(BRAND_VARIANT.SECONDARY);
  });

  it('leaves every sectionHeader field undefined when the field itself is unset (no faked default)', () => {
    const raw = makeRawPostListModule({ sectionHeader: null });

    const module = toPostListModule(raw, rawPosts, pagination);

    expect(module.sectionHeader).toEqual({
      heading: undefined,
      supportingText: undefined,
      align: undefined,
    });
  });

  it('maps sectionHeader.align when authored', () => {
    const raw = makeRawPostListModule({
      sectionHeader: {
        heading: 'Latest',
        supportingText: null,
        align: HEADING_ALIGN.RIGHT,
      },
    });

    const module = toPostListModule(raw, rawPosts, pagination);

    expect(module.sectionHeader.align).toBe(HEADING_ALIGN.RIGHT);
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

    const module = toPostListModule(raw, rawPosts, pagination);

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

    const module = toPostListModule(raw, rawPosts, pagination);

    expect(module.layout).toBeUndefined();
  });

  it('maps posts through toPostCard', () => {
    const raw = makeRawPostListModule();

    const module = toPostListModule(raw, rawPosts, pagination);

    expect(module.posts).toEqual([]);
  });

  it('maps currentPage/totalPages straight through', () => {
    const raw = makeRawPostListModule();

    const module = toPostListModule(raw, rawPosts, {
      currentPage: 2,
      totalPages: 5,
    });

    expect(module.currentPage).toBe(2);
    expect(module.totalPages).toBe(5);
  });

  it('maps an authored emptyMessage straight through', () => {
    const raw = makeRawPostListModule({ emptyMessage: 'No posts yet.' });

    const module = toPostListModule(raw, rawPosts, pagination);

    expect(module.emptyMessage).toBe('No posts yet.');
  });

  it('leaves emptyMessage undefined when the field is unset (no faked default)', () => {
    const raw = makeRawPostListModule({ emptyMessage: null });

    const module = toPostListModule(raw, rawPosts, pagination);

    expect(module.emptyMessage).toBeUndefined();
  });

  it('treats a whitespace-only emptyMessage as absent', () => {
    const raw = makeRawPostListModule({ emptyMessage: '   ' });

    const module = toPostListModule(raw, rawPosts, pagination);

    expect(module.emptyMessage).toBeUndefined();
  });
});
