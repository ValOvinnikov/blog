import { SOCIAL_PLATFORMS } from '@blog/config';
import type { IShareLinkItem } from '@blog/ui/components/molecules/share-link';

type TShareLinkPlatform =
  typeof SOCIAL_PLATFORMS.X | typeof SOCIAL_PLATFORMS.LINKEDIN;

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
 * `SOCIAL_PLATFORM_ICON`) alongside its own JSX before passing `links` into
 * `PostShare`.
 *
 * @example
 * const links = buildShareLinks({ url: 'https://example.com/post', title: 'My post' });
 * return <PostShare url={url} title={title} links={links} />;
 */
export const buildShareLinks = ({
  url,
  title,
}: {
  url: string;
  title: string;
}): TShareLinkItem[] => {
  return [
    {
      platform: SOCIAL_PLATFORMS.X,
      href: buildTwitterShareUrl(url, title),
      label: 'Share on X',
    },
    {
      platform: SOCIAL_PLATFORMS.LINKEDIN,
      href: buildLinkedInShareUrl(url),
      label: 'Share on LinkedIn',
    },
  ];
};

const buildTwitterShareUrl = (url: string, title: string): string => {
  const params = new URLSearchParams({ text: title, url });
  return `https://twitter.com/intent/tweet?${params.toString()}`;
};

const buildLinkedInShareUrl = (url: string): string => {
  const params = new URLSearchParams({ url });
  return `https://www.linkedin.com/sharing/share-offsite/?${params.toString()}`;
};
