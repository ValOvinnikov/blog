'use client';

import type { IShareLinkItem } from '@blog/ui';
import { ShareButtons } from '@blog/ui';
import { SmartLink } from '@web/components/shared/smart-link';

type TPostShareButtonsProps = {
  links: IShareLinkItem[];
  url: string;
};

/**
 * PostShareButtons — client-boundary wrapper around `@blog/ui`'s
 * `ShareButtons`: `@blog/ui` never touches `window`/clipboard itself, so this
 * is where the actual `navigator.clipboard.writeText` call for the
 * "Copy link" action lives, at the smallest leaf that needs it. `links`
 * (platform share URLs + icons) are built server-side and passed straight
 * through.
 */
export function PostShareButtons({ links, url }: TPostShareButtonsProps) {
  const handleCopy = () => {
    navigator.clipboard
      .writeText(url)
      .catch((error: unknown) => console.error('Failed to copy link:', error));
  };

  return <ShareButtons links={links} onCopy={handleCopy} linkAs={SmartLink} />;
}
