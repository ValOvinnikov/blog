import { BRAND_VARIANT, CONTAINER_WIDTH, HEADING_ALIGN } from '@blog/config';
import { makeRawPostLatestModule } from '@blog/service/testing/modules/fixtures';
import { makeRawPostCard } from '@blog/service/testing/pages/fixtures';

import {
  toPostLatestModule,
  type TRawPostLatestModulePosts,
} from './transformer';

const rawPosts: TRawPostLatestModulePosts = [];

describe('toPostLatestModule', () => {
  it('maps sectionHeader straight through', () => {
    const raw = makeRawPostLatestModule();

    const module = toPostLatestModule(raw, rawPosts);

    expect(module.sectionHeader).toEqual({
      heading: 'Latest',
      supportingText: undefined,
      align: undefined,
    });
  });

  it('maps brandVariant straight through', () => {
    const raw = makeRawPostLatestModule({
      brandVariant: BRAND_VARIANT.SECONDARY,
    });

    const module = toPostLatestModule(raw, rawPosts);

    expect(module.brandVariant).toBe(BRAND_VARIANT.SECONDARY);
  });

  it('leaves every sectionHeader field undefined when the field itself is unset (no faked default)', () => {
    const raw = makeRawPostLatestModule({ sectionHeader: null });

    const module = toPostLatestModule(raw, rawPosts);

    expect(module.sectionHeader).toEqual({
      heading: undefined,
      supportingText: undefined,
      align: undefined,
    });
  });

  it('maps sectionHeader.align when authored', () => {
    const raw = makeRawPostLatestModule({
      sectionHeader: {
        heading: 'Latest',
        supportingText: null,
        align: HEADING_ALIGN.RIGHT,
      },
    });

    const module = toPostLatestModule(raw, rawPosts);

    expect(module.sectionHeader.align).toBe(HEADING_ALIGN.RIGHT);
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

    const module = toPostLatestModule(raw, rawPosts);

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

    const module = toPostLatestModule(raw, rawPosts);

    expect(module.layout).toBeUndefined();
  });

  it('maps posts through toPostCard', () => {
    const raw = makeRawPostLatestModule();

    const module = toPostLatestModule(raw, [makeRawPostCard({ _id: 'a' })]);

    expect(module.posts.map((p) => p.id)).toEqual(['a']);
  });

  it('returns an empty posts array when nothing resolves', () => {
    const raw = makeRawPostLatestModule();

    const module = toPostLatestModule(raw, rawPosts);

    expect(module.posts).toEqual([]);
  });
});
