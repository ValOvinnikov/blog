import { LOCALE_ISO_CODES } from '@blog/config/constants';

import { toPaginationParams } from './to-pagination-params';

const { EN, NL } = LOCALE_ISO_CODES;

describe(toPaginationParams, () => {
  it('returns pages 2..totalPages for each page with a full corpus', () => {
    expect(
      toPaginationParams([
        { slug: 'typescript', language: EN, pageSize: 9, postCount: 20 },
        { slug: 'react', language: EN, pageSize: 9, postCount: 9 },
      ]),
    ).toEqual([
      { slug: 'typescript', language: EN, page: '2' },
      { slug: 'typescript', language: EN, page: '3' },
    ]);
  });

  it('keeps each page in its own language', () => {
    expect(
      toPaginationParams([
        { slug: 'typescript', language: NL, pageSize: 9, postCount: 10 },
      ]),
    ).toEqual([{ slug: 'typescript', language: NL, page: '2' }]);
  });

  it('contributes no entries for a page with zero posts', () => {
    expect(
      toPaginationParams([
        { slug: 'empty', language: EN, pageSize: 9, postCount: 0 },
      ]),
    ).toEqual([]);
  });

  it('contributes no entries for a page that fits on one page', () => {
    expect(
      toPaginationParams([
        { slug: 'typescript', language: EN, pageSize: 9, postCount: 5 },
      ]),
    ).toEqual([]);
  });

  it('contributes no entries for a page with no list module in modules[]', () => {
    expect(
      toPaginationParams([
        { slug: 'unconfigured', language: EN, pageSize: null, postCount: 20 },
      ]),
    ).toEqual([]);
  });

  it('returns an empty array when there are no pages', () => {
    expect(toPaginationParams([])).toEqual([]);
  });
});
