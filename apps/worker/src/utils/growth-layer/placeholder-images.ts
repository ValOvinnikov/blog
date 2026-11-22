import type { TStarterPlaceholderImageIds } from '@shinefold/config';
import {
  STARTER_PLACEHOLDER_IMAGE,
  type TStarterPlaceholderImage,
} from '@shinefold/config/constants';
import { SVG_CONTENT_TYPE } from '@worker/constants/growth-layer';
import type { createClientWithTimeout } from '@worker/utils/step-deps/step-deps';

type TSanityClient = ReturnType<typeof createClientWithTimeout>;

const PLACEHOLDER_IMAGES: Record<
  TStarterPlaceholderImage,
  { filename: string; svg: string }
> = {
  [STARTER_PLACEHOLDER_IMAGE.LOGO]: {
    filename: 'placeholder-logo.svg',
    svg: '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="120" viewBox="0 0 320 120"><rect width="320" height="120" fill="#f1f1f3"/><circle cx="70" cy="60" r="26" fill="#a3a3ad"/><rect x="112" y="46" width="150" height="28" rx="14" fill="#c4c4cc"/></svg>',
  },
  [STARTER_PLACEHOLDER_IMAGE.ILLUSTRATION]: {
    filename: 'placeholder-illustration.svg',
    svg: '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800"><rect width="1200" height="800" fill="#f1f1f3"/><circle cx="860" cy="250" r="110" fill="#d4d4da"/><path d="M0 800 L380 360 L640 620 L820 460 L1200 800 Z" fill="#a3a3ad"/></svg>',
  },
};

async function uploadPlaceholderImage(
  client: TSanityClient,
  image: TStarterPlaceholderImage,
): Promise<string> {
  const { filename, svg } = PLACEHOLDER_IMAGES[image];
  const asset = await client.assets.upload('image', Buffer.from(svg), {
    filename,
    contentType: SVG_CONTENT_TYPE,
  });
  return asset._id;
}

// Sanity keys an asset by its content hash, so a repeat upload returns the asset already in the dataset.
export async function uploadPlaceholderImages(
  client: TSanityClient,
): Promise<TStarterPlaceholderImageIds> {
  const [logo, illustration] = await Promise.all([
    uploadPlaceholderImage(client, STARTER_PLACEHOLDER_IMAGE.LOGO),
    uploadPlaceholderImage(client, STARTER_PLACEHOLDER_IMAGE.ILLUSTRATION),
  ]);

  return {
    [STARTER_PLACEHOLDER_IMAGE.LOGO]: logo,
    [STARTER_PLACEHOLDER_IMAGE.ILLUSTRATION]: illustration,
  };
}
