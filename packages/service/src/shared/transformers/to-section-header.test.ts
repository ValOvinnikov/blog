import {
  toRequiredSectionHeader,
  toSectionHeader,
  type TRawRequiredSectionHeader,
  type TRawSectionHeader,
} from './to-section-header';

const rawSectionHeader: TRawSectionHeader = {
  heading: 'Featured posts',
  supportingText: 'Hand-picked reads from the team',
};

const rawRequiredSectionHeader: TRawRequiredSectionHeader = {
  heading: 'Featured posts',
  supportingText: 'Hand-picked reads from the team',
};

describe('toSectionHeader', () => {
  it('maps a fully-authored sectionHeader object 1:1', () => {
    expect(toSectionHeader(rawSectionHeader)).toEqual(rawSectionHeader);
  });

  it('leaves individually-unset fields undefined when null (no faked default)', () => {
    expect(
      toSectionHeader({
        heading: null,
        supportingText: null,
      }),
    ).toEqual({
      heading: undefined,
      supportingText: undefined,
    });
  });
});

describe('toRequiredSectionHeader', () => {
  it('maps a fully-authored requiredSectionHeader object 1:1', () => {
    expect(toRequiredSectionHeader(rawRequiredSectionHeader)).toEqual(
      rawRequiredSectionHeader,
    );
  });

  it('maps heading through unchanged (never coalesced away)', () => {
    expect(
      toRequiredSectionHeader({
        heading: 'Latest from the blog',
        supportingText: null,
      }),
    ).toEqual({
      heading: 'Latest from the blog',
      supportingText: undefined,
    });
  });
});
