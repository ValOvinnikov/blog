import { routing } from '@platform/i18n/routing';
import type { MetadataRoute } from 'next';
import { getTranslations } from 'next-intl/server';

import {
  size as appleIconSize,
  contentType as appleIconType,
} from './apple-icon';
import { contentType as iconType } from './icon';

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const t = await getTranslations({
    locale: routing.defaultLocale,
    namespace: 'pageMetadata',
  });
  const name = t('root');

  return {
    name,
    short_name: name,
    start_url: '/',
    icons: [
      { src: '/icon', type: iconType, sizes: 'any' },
      {
        src: '/apple-icon',
        type: appleIconType,
        sizes: `${appleIconSize.width}x${appleIconSize.height}`,
      },
    ],
  };
}
