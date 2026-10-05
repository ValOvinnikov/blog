import type { ISanityImage } from '@blog/config';
import {
  createProjectCache,
  type TSanityProjectRef,
} from '@blog/service/sanity/project-cache/project-cache';
import {
  createImageUrlBuilder,
  type FitMode,
  type SanityImageSource,
} from '@sanity/image-url';

const getCachedImageUrlBuilder =
  createProjectCache<ReturnType<typeof createImageUrlBuilder>>();

function getImageUrlBuilder(project: TSanityProjectRef) {
  return getCachedImageUrlBuilder(project, () =>
    createImageUrlBuilder({
      projectId: project.projectId,
      dataset: project.dataset,
    }),
  );
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
