// Augments the global RequestInit interface with Next.js-specific fetch options
// so that @sanity/client's `next` option resolves correctly.
// This mirrors the declaration that next/dist/server/lib/router-utils/types.d.ts exports.

// eslint-disable-next-line @typescript-eslint/naming-convention
interface RequestInit {
  next?: {
    revalidate?: number | false;
    tags?: string[];
  };
}
