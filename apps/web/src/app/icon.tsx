import { buildImageUrl, service, type TRawImage } from '@blog/service';

export const contentType = 'image/svg+xml';

const FAVICON_SIZE = 64;
const FETCH_TIMEOUT_MS = 5000;

/**
 * Inlined rather than read from a static file at request time — this is the
 * ultimate fallback for every failure mode below (fetch failure, timeout,
 * missing settings), so it must be zero-I/O and unable to throw itself.
 */
const FALLBACK_MARK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
  <style>
    .l1{fill:#2E6BD6}.l2{fill:#4F87E8}.l3{fill:#7AA6F0}
    @media (prefers-color-scheme:dark){.l1{fill:#3D78DE}.l2{fill:#5F92EC}.l3{fill:#93B8F5}}
  </style>
  <polygon class="l1" points="40,42 66,51 40,60 14,51"/>
  <polygon class="l2" points="40,27 66,36 40,45 14,36"/>
  <polygon class="l3" points="40,12 66,21 40,30 14,21"/>
</svg>`;

async function fetchLogoIcon(
  logoAsset: TRawImage,
): Promise<Response | undefined> {
  const iconUrl = buildImageUrl(logoAsset, {
    width: FAVICON_SIZE,
    height: FAVICON_SIZE,
    fit: 'crop',
  });

  if (!iconUrl) return undefined;

  const response = await fetch(iconUrl, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  if (!response.ok) {
    console.error(
      `Error fetching uploaded logo for icon: received ${response.status}`,
    );
    return undefined;
  }

  return response;
}

function buildFallbackResponse(): Response {
  return new Response(FALLBACK_MARK_SVG, {
    headers: { 'Content-Type': contentType },
  });
}

/**
 * Dynamic favicon route (Next.js's code-generated `icon` file convention) —
 * fetches the tenant's uploaded logo (`settings_site.brand.logo`) through as
 * a small square crop, passing the CDN's own `Content-Type` header through
 * unchanged. Falls back to a single default mark (`FALLBACK_MARK_SVG`, which
 * embeds its own `prefers-color-scheme` media query) whenever no logo is
 * uploaded, or the fetch fails for any reason — a broken favicon must never
 * break the page it's attached to.
 */
export default async function Icon() {
  const result = await service.global.siteSettings.v1.getSiteSettings();

  if (!result.ok) {
    console.error(`Error fetching site settings for icon: ${result.error}`);
    return buildFallbackResponse();
  }

  const { logoAsset } = result.data.brand;
  if (!logoAsset) {
    return buildFallbackResponse();
  }

  try {
    const logoResponse = await fetchLogoIcon(logoAsset);
    if (logoResponse) {
      const bytes = await logoResponse.arrayBuffer();

      return new Response(bytes, {
        headers: {
          'Content-Type':
            logoResponse.headers.get('content-type') ?? contentType,
        },
      });
    }
  } catch (error) {
    console.error(`Error fetching uploaded logo for icon: ${error}`);
  }

  return buildFallbackResponse();
}
