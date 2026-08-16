import type { IShareLinkItem } from '@blog/ui/molecules';

/** Platform identifier per share link — matches the keys `toSocialIconName`
 * (`apps/web/src/utils/to-social-icon-name.ts`) already understands, so a
 * caller can resolve the right icon without parsing the label string. */
type TShareLinkPlatform = 'x' | 'linkedin';

type TShareLinkItem = IShareLinkItem & { platform: TShareLinkPlatform };

/**
 * Builds the `TShareLinkItem[]` for a post's share actions — `PostShare`
 * (`apps/web/src/components/shared/post-share`) maps each entry to a
 * `PopoverMenu.Item as={SmartLink}`, so this is where the platform-specific
 * share URLs (X, LinkedIn) get constructed.
 *
 * Icons are left undefined here rather than attached in this function: they
 * are `ReactNode`s, and this stays a plain, framework-free `.ts` util so it
 * can be unit-tested without a DOM/React renderer — the web layer
 * (`blog-post-page`) attaches an icon per item (via `platform` +
 * `toSocialIconName`) alongside its own JSX before passing `links` into
 * `PostShare`.
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
}): TShareLinkItem[] {
  return [
    {
      platform: 'x',
      href: buildTwitterShareUrl(url, title),
      label: 'Share on X',
    },
    {
      platform: 'linkedin',
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
