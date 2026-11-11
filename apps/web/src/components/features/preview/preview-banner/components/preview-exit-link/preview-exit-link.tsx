'use client';

import { routes, type TLocaleIsoCode } from '@blog/config';
import { TextLink } from '@blog/ui/components/atoms/text-link';
import { usePublicPathname } from '@web/hooks/use-public-pathname';
import { toLocalizedPathname } from '@web/utils/to-localized-pathname';

type TPreviewExitLinkProps = {
  label: string;
  locale: TLocaleIsoCode;
  defaultLocale: TLocaleIsoCode;
};

export const PreviewExitLink = ({
  label,
  locale,
  defaultLocale,
}: TPreviewExitLinkProps) => {
  const currentPath = toLocalizedPathname({
    href: usePublicPathname(),
    locale,
    defaultLocale,
  });

  return <TextLink href={routes.previewExit(currentPath)}>{label}</TextLink>;
};
