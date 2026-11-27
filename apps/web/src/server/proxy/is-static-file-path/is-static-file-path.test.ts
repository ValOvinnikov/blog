import { routes } from '@shinefold/config';
import { MOCK_TAG_SLUG } from '@web/testing/shared/tag/fixtures';

import { isStaticFilePath } from './is-static-file-path';

describe(isStaticFilePath, () => {
  it.each([
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml',
    '/site.webmanifest',
    '/images/logo.png',
    '/wp-login.php',
    '/wp-admin/setup-config.php',
    '/.env',
  ])('treats %s as a static file', (path) => {
    expect(isStaticFilePath(path)).toBe(true);
  });

  it.each([
    '/blog/v1.2-release-notes',
    '/guides/v2.0',
    '/blog/v1.2/post',
    '/blog.rsc',
    '/blog.segments/_tree.segment.rsc',
    routes.rssFeed(),
    routes.tagRssFeed(MOCK_TAG_SLUG),
  ])('treats %s as a page path', (path) => {
    expect(isStaticFilePath(path)).toBe(false);
  });
});
