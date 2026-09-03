import {
  createImageUrlBuilder,
  type FitMode,
  type SanityImageSource,
} from '@sanity/image-url';

import type { TTenantSanityContext } from './client';

type TImageUrlBuilder = ReturnType<typeof createImageUrlBuilder>;

export type TImageTenant = Pick<TTenantSanityContext, 'projectId' | 'dataset'>;

function imageTenantKey(tenant: TImageTenant): string {
  return `${tenant.projectId}:${tenant.dataset}`;
}

// Small LRU (insertion-order Map: re-set moves an entry to the end),
// mirroring `client.ts`'s tenant client cache. Keyed per project/dataset
// rather than a single module-level singleton — a bare `builder ??=` would
// freeze the first tenant rendered for the process lifetime and leak its
// asset URLs into every tenant rendered after it.
const MAX_CACHED_TENANT_IMAGE_BUILDERS = 20;
const tenantImageBuilders = new Map<string, TImageUrlBuilder>();

function getImageUrlBuilder(tenant: TImageTenant): TImageUrlBuilder {
  const key = imageTenantKey(tenant);
  const cached = tenantImageBuilders.get(key);
  if (cached) {
    tenantImageBuilders.delete(key);
    tenantImageBuilders.set(key, cached);
    return cached;
  }

  const builder = createImageUrlBuilder({
    projectId: tenant.projectId,
    dataset: tenant.dataset,
  });

  tenantImageBuilders.set(key, builder);
  if (tenantImageBuilders.size > MAX_CACHED_TENANT_IMAGE_BUILDERS) {
    const oldestKey = tenantImageBuilders.keys().next().value;
    if (oldestKey !== undefined) tenantImageBuilders.delete(oldestKey);
  }

  return builder;
}

export type TImageTransformOptions = {
  width?: number;
  height?: number;
  fit?: FitMode;
  quality?: number;
};

export function urlForImage(
  source: SanityImageSource,
  tenant: TImageTenant,
  options?: TImageTransformOptions,
): string {
  let image = getImageUrlBuilder(tenant).image(source).auto('format');
  if (options?.width) image = image.width(options.width);
  if (options?.height) image = image.height(options.height);
  if (options?.fit) image = image.fit(options.fit);
  if (options?.quality) image = image.quality(options.quality);
  return image.url();
}
