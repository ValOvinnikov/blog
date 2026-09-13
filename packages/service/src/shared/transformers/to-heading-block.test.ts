import { toHeadingBlock, type TRawHeadingBlock } from './to-heading-block';

const rawHeadingBlock: TRawHeadingBlock = {
  heading: 'Featured posts',
  supportingText: 'Hand-picked reads from the team',
};

describe(toHeadingBlock, () => {
  it('maps a fully-authored headingBlock object 1:1', () => {
    expect(toHeadingBlock(rawHeadingBlock)).toEqual(rawHeadingBlock);
  });

  it('maps heading through unchanged (never coalesced away)', () => {
    expect(
      toHeadingBlock({
        heading: 'Latest from the blog',
        supportingText: null,
      }),
    ).toEqual({
      heading: 'Latest from the blog',
      supportingText: undefined,
    });
  });
});
