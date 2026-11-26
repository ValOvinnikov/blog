import { SOCIAL_PLATFORMS } from '@shinefold/config';
import type { IShareLinkItem } from '@shinefold/ui/components/molecules/share-link';

type TShareLinkPlatform =
  typeof SOCIAL_PLATFORMS.X | typeof SOCIAL_PLATFORMS.LINKEDIN;

type TShareLinkItem = IShareLinkItem & { platform: TShareLinkPlatform };

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
