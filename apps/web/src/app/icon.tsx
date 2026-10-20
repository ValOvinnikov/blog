import { getSiteConfig } from '@web/server/site-config/get-site-config/get-site-config';
import { resolveRequestTenant } from '@web/server/tenant/request-tenant/request-tenant';
import { logger } from '@web/utils/logger/logger';

export const contentType = 'image/svg+xml';

const FETCH_TIMEOUT_MS = 5000;

// Inlined, not read from a file: it is the fallback for every failure below, so it must be zero-I/O.
const FALLBACK_MARK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
  <style>
    .l1{fill:#2E6BD6}.l2{fill:#4F87E8}.l3{fill:#7AA6F0}
    @media (prefers-color-scheme:dark){.l1{fill:#3D78DE}.l2{fill:#5F92EC}.l3{fill:#93B8F5}}
  </style>
  <polygon class="l1" points="40,42 66,51 40,60 14,51"/>
  <polygon class="l2" points="40,27 66,36 40,45 14,36"/>
  <polygon class="l3" points="40,12 66,21 40,30 14,21"/>
</svg>`;

const buildFallbackResponse = (): Response => {
  return new Response(FALLBACK_MARK_SVG, {
    headers: { 'Content-Type': contentType },
  });
};

const fetchFavicon = async (
  faviconUrl: string,
): Promise<Response | undefined> => {
  const response = await fetch(faviconUrl, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  if (!response.ok) {
    logger.error('icon.favicon_response_not_ok', { status: response.status });
    return undefined;
  }

  return response;
};

export default async function Icon() {
  const tenant = await resolveRequestTenant();
  if (!tenant) {
    return buildFallbackResponse();
  }

  const result = await getSiteConfig(tenant.id);
  if (!result.ok) {
    logger.error('icon.site_config_fetch_failed', { error: result.error });
    return buildFallbackResponse();
  }

  const faviconUrl = result.data?.faviconAssetUrl;
  if (!faviconUrl) {
    return buildFallbackResponse();
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
    logger.error('icon.favicon_fetch_failed', { error });
  }

  return buildFallbackResponse();
}
