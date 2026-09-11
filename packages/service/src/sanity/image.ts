import type { ISanityImage } from '@blog/config';
import {
  createImageUrlBuilder,
  type FitMode,
  type SanityImageSource,
} from '@sanity/image-url';

import type { TTenantSanityContext } from './client';

type TImageUrlBuilder = ReturnType<typeof createImageUrlBuilder>;

export type TSanityProjectRef = Pick<
  TTenantSanityContext,
  'projectId' | 'dataset'
>;

function sanityProjectRefKey(project: TSanityProjectRef): string {
  return `${project.projectId}:${project.dataset}`;
}

// Small LRU (insertion-order Map: re-set moves an entry to the end),
// mirroring `client.ts`'s tenant client cache. Keyed per project/dataset
// rather than a single module-level singleton — a bare `builder ??=` would
// freeze the first project rendered for the process lifetime and leak its
// asset URLs into every project rendered after it.
const MAX_CACHED_PROJECT_IMAGE_BUILDERS = 20;
const projectImageBuilders = new Map<string, TImageUrlBuilder>();

function getImageUrlBuilder(project: TSanityProjectRef): TImageUrlBuilder {
  const key = sanityProjectRefKey(project);
  const cached = projectImageBuilders.get(key);
  if (cached) {
    projectImageBuilders.delete(key);
    projectImageBuilders.set(key, cached);
    return cached;
  }

  const builder = createImageUrlBuilder({
    projectId: project.projectId,
    dataset: project.dataset,
  });

  projectImageBuilders.set(key, builder);
  if (projectImageBuilders.size > MAX_CACHED_PROJECT_IMAGE_BUILDERS) {
    const oldestKey = projectImageBuilders.keys().next().value;
    if (oldestKey !== undefined) projectImageBuilders.delete(oldestKey);
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
  project: TSanityProjectRef,
  options?: TImageTransformOptions,
): string {
  let image = getImageUrlBuilder(project).image(source).auto('format');
  if (options?.width) image = image.width(options.width);
  if (options?.height) image = image.height(options.height);
  if (options?.fit) image = image.fit(options.fit);
  if (options?.quality) image = image.quality(options.quality);
  return image.url();
}

/** Builds a rendered URL for an `ISanityImage` view-model, at the project/options the caller supplies. */
export function urlForSanityImage(
  image: ISanityImage,
  project: TSanityProjectRef,
  options?: TImageTransformOptions,
): string {
  const source: SanityImageSource = {
    asset: { _id: image.assetId },
    hotspot: image.hotspot,
    crop: image.crop,
  };
  return urlForImage(source, project, options);
}
