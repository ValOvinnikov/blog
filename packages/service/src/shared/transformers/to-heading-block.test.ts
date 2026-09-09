import {
  toHeadingBlock,
  toRequiredHeadingBlock,
  type TRawHeadingBlock,
  type TRawRequiredHeadingBlock,
} from './to-heading-block';

const rawHeadingBlock: TRawHeadingBlock = {
  heading: 'Featured posts',
  supportingText: 'Hand-picked reads from the team',
};

const rawRequiredHeadingBlock: TRawRequiredHeadingBlock = {
  heading: 'Featured posts',
  supportingText: 'Hand-picked reads from the team',
};

describe(toHeadingBlock, () => {
  it('maps a fully-authored headingBlock object 1:1', () => {
    expect(toHeadingBlock(rawHeadingBlock)).toEqual(rawHeadingBlock);
  });

  it('leaves individually-unset fields undefined when null (no faked default)', () => {
    expect(
      toHeadingBlock({
        heading: null,
        supportingText: null,
      }),
    ).toEqual({
      heading: undefined,
      supportingText: undefined,
    });
  });

  it('builds an all-undefined container when raw is null', () => {
    expect(toHeadingBlock(null)).toEqual({
      heading: undefined,
      supportingText: undefined,
    });
  });

  it('builds an all-undefined container when raw is undefined', () => {
    expect(toHeadingBlock(undefined)).toEqual({
      heading: undefined,
      supportingText: undefined,
    });
  });
});

describe(toRequiredHeadingBlock, () => {
  it('maps a fully-authored requiredHeadingBlock object 1:1', () => {
    expect(toRequiredHeadingBlock(rawRequiredHeadingBlock)).toEqual(
      rawRequiredHeadingBlock,
    );
  });

  it('maps heading through unchanged (never coalesced away)', () => {
    expect(
      toRequiredHeadingBlock({
        heading: 'Latest from the blog',
        supportingText: null,
      }),
    ).toEqual({
      heading: 'Latest from the blog',
      supportingText: undefined,
    });
  });
});
