import type { IShareLinkItem } from '@blog/ui';

import { buildShareLinks } from './build-share-links';

describe(buildShareLinks, () => {
  const url = 'https://example.com/blog/hello-world';
  const title = 'Hello World';

  it('builds a Twitter/X intent url with the title and url encoded', () => {
    const links = buildShareLinks({ url, title });
    const twitterLink = links.find((link) => link.label === 'Share on X');

    expect(twitterLink?.href).toBe(
      'https://twitter.com/intent/tweet?text=Hello+World&url=https%3A%2F%2Fexample.com%2Fblog%2Fhello-world',
    );
  });

  it('builds a LinkedIn share-offsite url with the url encoded', () => {
    const links = buildShareLinks({ url, title });
    const linkedInLink = links.find(
      (link) => link.label === 'Share on LinkedIn',
    );

    expect(linkedInLink?.href).toBe(
      'https://www.linkedin.com/sharing/share-offsite/?url=https%3A%2F%2Fexample.com%2Fblog%2Fhello-world',
    );
  });

  it('returns exactly two links, X and LinkedIn', () => {
    const links = buildShareLinks({ url, title });

    expect(links).toHaveLength(2);
    expect(links.map((link) => link.label)).toEqual([
      'Share on X',
      'Share on LinkedIn',
    ]);
  });

  it('returns items matching the IShareLinkItem shape (href + label, no icon)', () => {
    const links: IShareLinkItem[] = buildShareLinks({ url, title });

    links.forEach((link) => {
      expect(typeof link.href).toBe('string');
      expect(typeof link.label).toBe('string');
      expect(link.icon).toBeUndefined();
    });
  });

  it('encodes special characters in the title', () => {
    const links = buildShareLinks({
      url,
      title: 'Q&A: "Testing" & more',
    });
    const twitterLink = links.find((link) => link.label === 'Share on X');

    expect(twitterLink?.href).toContain(
      encodeURIComponent('Q&A: "Testing" & more').replace(/%20/g, '+'),
    );
  });
});
