import type { TMaybeUndefined } from '@blog/config';
import { toInitial } from '@blog/utils/primitives';
import { CACHE_CONTROL } from '@web/constants/http';
import { ICON_LOG } from '@web/constants/icon';
import { getBrandName } from '@web/server/site-config/get-brand-name/get-brand-name';
import { getSiteConfig } from '@web/server/site-config/get-site-config/get-site-config';
import { resolveRequestTenant } from '@web/server/tenant/request-tenant/request-tenant';
import {
  buildInitialTileSvg,
  buildNeutralTileSvg,
} from '@web/utils/build-tile-icon-svg';
import { logger } from '@web/utils/logger/logger';
import { toThemeTokens } from '@web/utils/to-theme-tokens';

export const contentType = 'image/svg+xml';

const FETCH_TIMEOUT_MS = 5000;

const buildSvgResponse = (svg: string): Response => {
  return new Response(svg, {
    headers: { 'Content-Type': contentType },
  });
};

const buildUncachedNeutralTileResponse = (): Response => {
  return new Response(buildNeutralTileSvg(), {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': CACHE_CONTROL.PRIVATE_NO_STORE,
    },
  });
};

const fetchFavicon = async (
  faviconUrl: string,
): Promise<TMaybeUndefined<Response>> => {
  const response = await fetch(faviconUrl, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  if (!response.ok) {
    logger.error(ICON_LOG.FAVICON_RESPONSE_NOT_OK, { status: response.status });
    return undefined;
  }

  return response;
};

export default async function Icon() {
  const tenant = await resolveRequestTenant();
  if (!tenant) {
    return buildSvgResponse(buildNeutralTileSvg());
  }

  const result = await getSiteConfig(tenant.id);
  if (!result.ok) {
    logger.error(ICON_LOG.SITE_CONFIG_FETCH_FAILED, { error: result.error });
    return buildUncachedNeutralTileResponse();
  }

  const siteConfig = result.data;
  const faviconUrl = siteConfig?.faviconAssetUrl;
  if (!faviconUrl) {
    const brandName = await getBrandName({
      tenantId: tenant.id,
      tenantName: tenant.name,
    });
    const { accentHue, logoHue } = toThemeTokens(siteConfig);

    return buildSvgResponse(
      buildInitialTileSvg(
        brandName ? toInitial(brandName) : undefined,
        logoHue ?? accentHue,
      ),
    );
  }

  try {
    const faviconResponse = await fetchFavicon(faviconUrl);
    if (faviconResponse) {
      const bytes = await faviconResponse.arrayBuffer();

      return new Response(bytes, {
        headers: {
          'Content-Type':
            faviconResponse.headers.get('content-type') ?? contentType,
        },
      });
    }
  } catch (error) {
    logger.error(ICON_LOG.FAVICON_FETCH_FAILED, { error });
  }

  return buildUncachedNeutralTileResponse();
}
