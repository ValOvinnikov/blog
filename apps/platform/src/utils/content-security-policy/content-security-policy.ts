type TBuildContentSecurityPolicyOptions = {
  isDev: boolean;
};

export const buildContentSecurityPolicy = ({
  isDev,
}: TBuildContentSecurityPolicyOptions): string => {
  // Next's per-render inline RSC payload cannot be hashed or nonced ahead of time; 'unsafe-eval' is Turbopack/HMR in dev.
  const scriptSrc = isDev
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    : "script-src 'self' 'unsafe-inline'";

  return [
    "default-src 'self'",
    // Vercel Blob (per-store subdomain), Auth.js sign-in provider logos, Studio asset previews, OAuth avatars; `blob:` is a staged upload's preview.
    "img-src 'self' blob: https://*.blob.vercel-storage.com https://authjs.dev https://cdn.sanity.io https://avatars.githubusercontent.com https://lh3.googleusercontent.com",
    scriptSrc,
    // Next.js and Tailwind inject inline <style> tags at runtime.
    "style-src 'self' 'unsafe-inline'",
    // The embedded Studio's @font-face for Inter, which stays loaded on every route after one Studio visit.
    "font-src 'self' https://design-system-static.sanity.io",
    // Wildcard on purpose: Studio calls a browser-redacted sanity.io host that could not be listed; `sanity-cdn.com` is its version check.
    "connect-src 'self' https://*.sanity.io https://sanity-cdn.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    // Some browsers apply `form-action` to the sign-in form's 302 to the OAuth provider, not only to its same-origin action.
    "form-action 'self' https://github.com https://accounts.google.com",
    "object-src 'none'",
  ].join('; ');
};
