import { LOCALE_BCP47_TAGS } from '@shinefold/config';
import { DRAFT_PREVIEW_MARKER } from '@web/server/draft-preview/constants/constants';
import { MOCK_TENANT_ID } from '@web/testing/shared/tenant/fixtures';
import { getDecodedFirstPathSegment } from '@web/utils/get-decoded-first-path-segment';

import { isUnroutablePath } from './is-unroutable-path';

const MOCK_POST_PATH = `/${LOCALE_BCP47_TAGS.EN}/blog/a.b`;
const MOCK_FIRST_SEGMENT = 'x';

const check = (pathname: string): boolean =>
  isUnroutablePath(pathname, getDecodedFirstPathSegment(pathname) ?? '');

describe(isUnroutablePath, () => {
  it.each([
    DRAFT_PREVIEW_MARKER,
    '~%70review',
    '%7Epreview',
    '%7epreview',
    '%257Epreview',
    '%25257epreview',
    '~%50REVIEW',
    '%7E%70%72%65%76%69%65%77',
  ])('refuses a path carrying the draft marker as %s', (marker) => {
    expect(check(`/${MOCK_FIRST_SEGMENT}${marker}${MOCK_POST_PATH}`)).toBe(
      true,
    );
  });

  it('refuses an encoded marker beside a malformed escape', () => {
    expect(check(`/%E0%A4%A/~%70review${MOCK_POST_PATH}`)).toBe(true);
  });

  it('refuses a path whose encoding nests deeper than any real address', () => {
    expect(
      check(`/${MOCK_FIRST_SEGMENT}%25252525252541${MOCK_POST_PATH}`),
    ).toBe(true);
  });

  it('refuses a tenant-shaped first segment', () => {
    expect(check(`/${MOCK_TENANT_ID}${MOCK_POST_PATH}`)).toBe(true);
  });

  it.each([
    MOCK_POST_PATH,
    `/${LOCALE_BCP47_TAGS.EN}/blog/preview`,
    `/${LOCALE_BCP47_TAGS.EN}/blog/%70review`,
    `/${LOCALE_BCP47_TAGS.EN}/blog/caf%25C3%25A9`,
  ])('routes %s', (path) => {
    expect(check(path)).toBe(false);
  });
});
