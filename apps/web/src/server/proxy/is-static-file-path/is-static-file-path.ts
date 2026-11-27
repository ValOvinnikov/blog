// Mirrors the extension list in `proxy.ts`'s matcher, which Next requires as a literal.
const STATIC_FILE_PATH_PATTERN =
  /\/(?!rss\.xml$)[^/]*\.(?:ico|png|jpe?g|gif|svg|webp|avif|txt|xml|json|webmanifest|m?js|css|map|woff2?|ttf|otf|php|aspx?|env)$/;

/** A slug may contain a dot, so only a known file extension on the last segment marks a static file. */
export const isStaticFilePath = (pathname: string): boolean =>
  STATIC_FILE_PATH_PATTERN.test(pathname);
