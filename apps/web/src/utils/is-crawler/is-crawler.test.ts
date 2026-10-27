import { isCrawler } from './is-crawler';

const BROWSER_USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15';

describe(isCrawler, () => {
  it.each([
    'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
    'Mozilla/5.0 (compatible; Yahoo! Slurp; http://help.yahoo.com/help/us/ysearch/slurp)',
    'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/120.0 Safari/537.36',
  ])('recognises %s', (userAgent) => {
    expect(isCrawler(userAgent)).toBe(true);
  });

  it.each([null, ''])(
    'treats a request with user agent %j as a crawler',
    (userAgent) => {
      expect(isCrawler(userAgent)).toBe(true);
    },
  );

  it('lets a browser through', () => {
    expect(isCrawler(BROWSER_USER_AGENT)).toBe(false);
  });
});
