import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { service, urlForImage } from '@blog/service';

export const contentType = 'image/svg+xml';

const FAVICON_SIZE = 64;
const FETCH_TIMEOUT_MS = 5000;
const FALLBACK_MARK_PATH = join(
  process.cwd(),
  'public/brand/valstack-mark.svg',
);

async function fetchLogoIcon(logoUrl: string): Promise<Response | undefined> {
  const iconUrl = urlForImage(logoUrl, {
    width: FAVICON_SIZE,
    height: FAVICON_SIZE,
    fit: 'crop',
  });

  const response = await fetch(iconUrl, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  return response.ok ? response : undefined;
}

async function buildFallbackResponse(): Promise<Response> {
  const fallback = await readFile(FALLBACK_MARK_PATH);

  return new Response(fallback, { headers: { 'Content-Type': contentType } });
}

/**
 * Dynamic favicon route (Next.js's code-generated `icon` file convention) —
 * fetches the tenant's uploaded logo (`settings_site.brand.logo`) through as
 * a small square crop, passing the CDN's own `Content-Type` header through
 * unchanged. Falls back to a single static default mark
 * (`public/brand/valstack-mark.svg`, which embeds its own
 * `prefers-color-scheme` media query) whenever no logo is uploaded, or the
 * fetch fails for any reason — a broken favicon must never break the page
 * it's attached to.
 */
export default async function Icon() {
  const result = await service.global.siteSettings.v1.getSiteSettings();

  if (!result.ok) {
    console.error(`Error fetching site settings for icon: ${result.error}`);
    return buildFallbackResponse();
  }

  const { logoUrl } = result.data.brand;
  if (!logoUrl) {
    return buildFallbackResponse();
  }

  try {
    const logoResponse = await fetchLogoIcon(logoUrl);
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
