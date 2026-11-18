import { DRAFT_PREVIEW_MARKER } from '@web/server/draft-preview/constants/constants';
import { MOCK_TENANT_ID } from '@web/testing/shared/tenant/fixtures';

import { isUnroutablePath } from './is-unroutable-path';

const EN = 'en';
const POST_PATH = '/blog/a.b';

const pathWithMarker = (marker: string): string =>
  `/${MOCK_TENANT_ID}${marker}/${EN}${POST_PATH}`;

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
    expect(isUnroutablePath(pathWithMarker(marker), EN)).toBe(true);
  });

  it('refuses an encoded marker beside a malformed escape', () => {
    expect(isUnroutablePath(`/%E0%A4%A/~%70review${POST_PATH}`, EN)).toBe(true);
  });

  it('refuses a tenant-shaped first segment', () => {
    expect(
      isUnroutablePath(`/${MOCK_TENANT_ID}${POST_PATH}`, MOCK_TENANT_ID),
    ).toBe(true);
  });

  it.each([
    `/${EN}${POST_PATH}`,
    `/${EN}/blog/preview`,
    `/${EN}/blog/%70review`,
  ])('routes %s', (path) => {
    expect(isUnroutablePath(path, EN)).toBe(false);
  });
});
