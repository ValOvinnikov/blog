import { realpathSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const isDev = process.env.NODE_ENV !== 'production';

// Agent worktrees symlink their root node_modules to the primary checkout's
// copy (.husky/post-checkout), and Turbopack refuses to resolve through
// symlinks that leave its project root. Anchor the root at the checkout that
// physically hosts the dependencies: in a shared-deps worktree that is the
// primary checkout (which also contains the worktree, under
// .claude/worktrees/); everywhere else realpath is the workspace root itself,
// i.e. the exact value Turbopack would infer on its own.
//
// `../..` assumes apps/web's current depth (repo root/apps/web) — revisit if
// this app ever moves.
const workspaceRoot = resolve(process.cwd(), '../..');
const turbopackRoot = (() => {
  try {
    return dirname(realpathSync(join(workspaceRoot, 'node_modules')));
  } catch {
    return workspaceRoot; // no node_modules yet — nothing to resolve through
  }
})();

// Next.js App Router injects its own inline scripts on every page — the
// `self.__next_f.push(...)` RSC/hydration payload (and our inline dark-mode
// bootstrap). Their content is per-render, so it can't be hashed, and a
// per-request nonce would force dynamic rendering (we're static/ISR). So
// `script-src` allows 'unsafe-inline' (a hash/nonce would make the browser
// *ignore* it), plus 'unsafe-eval' in dev for Turbopack/HMR. Same-origin-only
// external scripts still apply, and every other directive stays strict.
const scriptSrc = isDev
  ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
  : "script-src 'self' 'unsafe-inline'";

const contentSecurityPolicy = [
  "default-src 'self'",
  "img-src 'self' https://cdn.sanity.io data:",
  scriptSrc,
  // 'unsafe-inline' is required because Next.js and Tailwind inject inline
  // <style> tags at runtime (e.g. Next's style-loader output, CSS-in-JS
  // from streamed RSC payloads); there is no static, hashable set of style
  // content to allow-list instead.
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "connect-src 'self' https://cdn.sanity.io",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ');

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: contentSecurityPolicy,
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
];

const config: NextConfig = {
  turbopack: { root: turbopackRoot },
  transpilePackages: ['@blog/ui', '@blog/service', '@blog/config'],
  // `src/app/[locale]/layout.tsx` is a top-level dynamic segment, so there is
  // no single `app/layout.tsx` to compose a global 404 from. `global-not-
  // found.js` (`src/app/global-not-found.tsx`) is Next's documented answer
  // to that exact topology — it bypasses normal layout composition and
  // renders a fully self-contained document instead.
  experimental: {
    globalNotFound: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default withNextIntl(config);
