type TBuildContentSecurityPolicyOptions = {
  isDev: boolean;
};

export const buildContentSecurityPolicy = ({
  isDev,
}: TBuildContentSecurityPolicyOptions): string => {
  // Next.js App Router injects its own inline scripts on every page — the
  // `self.__next_f.push(...)` RSC/hydration payload. Its content is
  // per-render, so it can't be hashed or replaced with a static nonce ahead
  // of time. So `script-src` allows 'unsafe-inline' (a hash/nonce would make
  // the browser *ignore* it), plus 'unsafe-eval' in dev for Turbopack/HMR.
  // Same-origin-only external scripts still apply, and every other
  // directive stays strict.
  const scriptSrc = isDev
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    : "script-src 'self' 'unsafe-inline'";

  return [
    "default-src 'self'",
    // `img-src` allows two external origins beyond 'self': the Vercel Blob
    // public storage host the Look tab's logo/favicon thumbnails load from
    // (a public-access Blob store's pathname is per-store, not fixed, hence
    // the wildcard subdomain), and authjs.dev, which Auth.js's built-in
    // sign-in page (no custom `pages.signIn` is configured) loads each OAuth
    // provider's logo SVG from.
    "img-src 'self' https://*.blob.vercel-storage.com https://authjs.dev",
    scriptSrc,
    // 'unsafe-inline' is required because Next.js and Tailwind inject inline
    // <style> tags at runtime; there is no static, hashable set of style
    // content to allow-list instead.
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    // Auth.js's built-in sign-in page (no custom `pages.signIn` is
    // configured) renders each OAuth provider as a same-origin <form>,
    // which the app then 302-redirects to the provider's authorize
    // endpoint. Some browsers apply `form-action` to that redirect target,
    // not just the form's own `action` attribute, so the provider origins
    // have to be listed here even though the submission itself is
    // same-origin. apps/web never hits this path — its sign-in menu calls
    // next-auth/react's client `signIn()`, a fetch + JS navigation, not a
    // native form post.
    "form-action 'self' https://github.com https://accounts.google.com",
    "object-src 'none'",
  ].join('; ');
};
