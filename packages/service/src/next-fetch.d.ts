// Augments the global RequestInit interface with the Next.js extended fetch
// options. This mirrors what `next/types/global.d.ts` declares so that the
// `@sanity/client` conditional type `('next' extends keyof RequestInit ? …)`
// resolves correctly — without requiring a full `next` package dependency.

interface NextFetchRequestConfig {
  revalidate?: number | false;
  tags?: string[];
}

interface RequestInit {
  next?: NextFetchRequestConfig | undefined;
}
