import { service } from '@blog/service';
import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Satori (the `next/og` renderer) needs literal hex colours — it can't read
// the site's OKLCH design tokens (`--logo-1/2/3`, `--bg`, `--text*` in
// `configs/tailwind/theme.css`). These are that dark-mode palette's sRGB
// equivalents, converted once by hand (Console brand variant only — no
// Indigo-variant OG image, out of scope for #490). The dark palette is used
// regardless of the visitor's system theme: this is a single static asset
// shared by every share surface, so it can't itself respond to
// `prefers-color-scheme` the way the favicon route (`icon.tsx`) does.
const COLORS = {
  bg: '#0d1012',
  logo1: '#007cd9',
  logo2: '#3b9cf6',
  logo3: '#73c3ff',
  text: '#eceff1',
  textMuted: '#a1a5a9',
};

const FONT_FAMILY = 'Space Grotesk';
const FONT_WEIGHT = 700;

// Fonts are effectively immutable per family/weight/subset — cache the
// Google Fonts round trip for a long time. Without this both `fetch` calls
// default to `no-store`, which forces this route fully dynamic (no static/
// ISR generation) and does two live external round-trips on every crawler
// hit.
const FONT_CACHE_SECONDS = 60 * 60 * 24 * 365; // 1 year

/**
 * Fetches a Google Font as raw bytes for Satori — `next/font`'s CSS
 * variables aren't readable inside `ImageResponse`, so the font has to be
 * fetched and embedded per request. Requesting the CSS without a browser
 * user-agent makes Google's `css2` endpoint return a `truetype`/`opentype`
 * source Satori can parse directly (its default `woff2` response can't be).
 */
async function loadGoogleFont(
  family: string,
  weight: number,
  text: string,
): Promise<ArrayBuffer> {
  const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&text=${encodeURIComponent(text)}`;
  const cssResponse = await fetch(cssUrl, {
    next: { revalidate: FONT_CACHE_SECONDS },
  });
  const css = await cssResponse.text();
  const resource = css.match(
    /src: url\(([^)]+)\) format\('(opentype|truetype)'\)/,
  );
  const fontUrl = resource?.[1];

  if (!fontUrl) {
    throw new Error(`Could not resolve a font source for ${family}`);
  }

  const response = await fetch(fontUrl, {
    next: { revalidate: FONT_CACHE_SECONDS },
  });

  if (!response.ok) {
    throw new Error(`Could not fetch font data for ${family}`);
  }

  return response.arrayBuffer();
}

const mark = (
  <svg width="96" height="96" viewBox="0 0 24 24">
    <polygon points="12,3 22,7 12,11 2,7" fill={COLORS.logo1} />
    <polygon points="12,8 22,12 12,16 2,12" fill={COLORS.logo2} />
    <polygon points="12,13 22,17 12,21 2,17" fill={COLORS.logo3} />
  </svg>
);

function renderMarkOnly(): ImageResponse {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.bg,
      }}
    >
      {mark}
    </div>,
    size,
  );
}

export type TBuildDefaultSocialImageOptions = {
  brandName?: string;
  tagline?: string;
};

/**
 * Renders the site's default OG/Twitter share image (Console brand variant
 * only) — the fallback used whenever a route has no more specific
 * `seo.ogImageUrl` (see `toMetadata`). Shared by `opengraph-image.tsx` and
 * `twitter-image.tsx`, which use identical 1200×630 `summary_large_image`
 * dimensions, so one implementation covers both file conventions.
 *
 * Renders the brand mark alone — no Google Fonts fetch — whenever `brandName`
 * is unavailable (the `siteSettings` fetch failed) or the font fetch itself
 * fails; either way this must still return a valid image rather than let the
 * route throw, since it's the site's last-resort fallback image.
 */
export async function buildDefaultSocialImage({
  brandName,
  tagline,
}: TBuildDefaultSocialImageOptions): Promise<ImageResponse> {
  if (!brandName) {
    return renderMarkOnly();
  }

  let fontData: ArrayBuffer;
  try {
    fontData = await loadGoogleFont(
      FONT_FAMILY,
      FONT_WEIGHT,
      `${brandName}${tagline ?? ''}`,
    );
  } catch (error) {
    console.error(`Error loading font for default social image: ${error}`);
    return renderMarkOnly();
  }

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'center',
        gap: 28,
        padding: 96,
        backgroundColor: COLORS.bg,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        {mark}
        <span
          style={{
            fontFamily: FONT_FAMILY,
            fontSize: 64,
            fontWeight: FONT_WEIGHT,
            color: COLORS.text,
            letterSpacing: '-0.02em',
          }}
        >
          {brandName}
        </span>
      </div>
      {tagline ? (
        <span
          style={{
            fontFamily: FONT_FAMILY,
            fontSize: 32,
            color: COLORS.textMuted,
          }}
        >
          {tagline}
        </span>
      ) : null}
    </div>,
    {
      ...size,
      fonts: [
        {
          name: FONT_FAMILY,
          data: fontData,
          style: 'normal',
          weight: FONT_WEIGHT,
        },
      ],
    },
  );
}

/**
 * Fetches `siteSettings` for `buildDefaultSocialImage` — shared by
 * `opengraph-image.tsx` and `twitter-image.tsx` so the fetch-and-fallback
 * logic (and its error logging) lives in one place. `routeName` is only used
 * to identify the caller in the logged error.
 */
export async function resolveDefaultSocialImageProps(
  routeName: string,
): Promise<TBuildDefaultSocialImageOptions> {
  const result = await service.global.siteSettings.v1.getSiteSettings();

  if (!result.ok) {
    console.error(
      `Error fetching site settings for ${routeName}: ${result.error}`,
    );
    return {};
  }

  const { brand, tagline } = result.data;

  return { brandName: brand.name, tagline };
}
