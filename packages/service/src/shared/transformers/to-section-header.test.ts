import { HEADING_ALIGN } from '@blog/config';

import {
  toRequiredSectionHeader,
  toSectionHeader,
  type TRawRequiredSectionHeader,
  type TRawSectionHeader,
} from './to-section-header';

const rawSectionHeader: TRawSectionHeader = {
  heading: 'Featured posts',
  supportingText: 'Hand-picked reads from the team',
  align: HEADING_ALIGN.CENTER,
};

const rawRequiredSectionHeader: TRawRequiredSectionHeader = {
  heading: 'Featured posts',
  supportingText: 'Hand-picked reads from the team',
  align: HEADING_ALIGN.CENTER,
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
        align: null,
      }),
    ).toEqual({
      heading: undefined,
      supportingText: undefined,
      align: undefined,
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
        align: null,
      }),
    ).toEqual({
      heading: 'Latest from the blog',
      supportingText: undefined,
      align: undefined,
    });
  });
});
