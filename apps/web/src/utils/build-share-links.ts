import type { IShareLinkItem } from '@blog/ui/molecules';

/**
 * Builds the `IShareLinkItem[]` for a post's share actions — `PostShare`
 * (`apps/web/src/components/shared/post-share`) maps each entry to a
 * `PopoverMenu.Item as={SmartLink}`, so this is where the platform-specific
 * share URLs (X, LinkedIn) get constructed.
 *
 * Icons are left undefined here rather than attached in this function: they
 * are `ReactNode`s, and this stays a plain, framework-free `.ts` util so it
 * can be unit-tested without a DOM/React renderer — the web layer
 * (`blog-post-page`) attaches an icon per item alongside its own JSX before
 * passing `links` into `PostShare`.
 *
 * @example
 * const links = buildShareLinks({ url: 'https://example.com/post', title: 'My post' });
 * return <PostShare url={url} title={title} links={links} />;
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
