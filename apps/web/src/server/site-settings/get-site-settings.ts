import { service } from '@blog/service';
import { getRequestContext } from '@web/server/request-context/request-context';
import { cache } from 'react';

export const getSiteSettings = cache(async () => {
  const { sanityContext } = await getRequestContext();
  return service.global.siteSettings.v1.getSiteSettings(sanityContext);
});
