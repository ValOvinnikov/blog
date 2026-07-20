import type { IShareLinkItem } from '@blog/ui';

/**
 * Builds the `IShareLinkItem[]` for a post's share actions — `@blog/ui`'s
 * `ShareButtons` only renders whatever `links` it's given, so this is where
 * the platform-specific share URLs (X, LinkedIn) get constructed.
 *
 * Icons are left undefined here rather than attached in this function: they
 * are `ReactNode`s, and this stays a plain, framework-free `.ts` util so it
 * can be unit-tested without a DOM/React renderer — the future consumer that
 * composes `<ShareButtons />` (post detail page, #76) attaches an icon per
 * item alongside its own JSX.
 *
 * @example
 * const links = buildShareLinks({ url: 'https://example.com/post', title: 'My post' });
 * return <ShareButtons links={links} />;
 */
export function buildShareLinks({
  url,
  title,
}: {
  url: string;
  title: string;
}): IShareLinkItem[] {
  return [
    {
      href: buildTwitterShareUrl(url, title),
      label: 'Share on X',
    },
    {
      href: buildLinkedInShareUrl(url),
      label: 'Share on LinkedIn',
    },
  ];
}

function buildTwitterShareUrl(url: string, title: string): string {
  const params = new URLSearchParams({ text: title, url });
  return `https://twitter.com/intent/tweet?${params.toString()}`;
}

function buildLinkedInShareUrl(url: string): string {
  const params = new URLSearchParams({ url });
  return `https://www.linkedin.com/sharing/share-offsite/?${params.toString()}`;
}
