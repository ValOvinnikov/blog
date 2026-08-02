import type {
  BodyImage,
  ISanityImage,
  ISanityImageCrop,
  ISanityImageHotspot,
} from '@blog/config';

function toHotspot(raw: BodyImage['hotspot']): ISanityImageHotspot | undefined {
  if (
    !raw ||
    raw.x == null ||
    raw.y == null ||
    raw.height == null ||
    raw.width == null
  ) {
    return undefined;
  }

  return { x: raw.x, y: raw.y, height: raw.height, width: raw.width };
}

function toCrop(raw: BodyImage['crop']): ISanityImageCrop | undefined {
  if (
    !raw ||
    raw.top == null ||
    raw.bottom == null ||
    raw.left == null ||
    raw.right == null
  ) {
    return undefined;
  }

  return { top: raw.top, bottom: raw.bottom, left: raw.left, right: raw.right };
}

/**
 * toPortableTextImage — converts a raw `bodyImage` Portable Text body
 * block into the `ISanityImage` view-model `SanityImage` renders.
 *
 * Body content is fetched unprojected (`body: sub.field('body[]')` in
 * `postDetailFragment`), so each `bodyImage` block still carries a bare
 * asset *reference* (`{ _ref, _type, _weak }`), unlike `service`'s own
 * `toSanityImage`, which expects an already-dereferenced asset (`_id` +
 * `metadata`). Sanity image asset `_ref` values are themselves the asset
 * document's `_id` (same convention `@sanity/image-url` relies on), so the
 * reference alone is enough to build a CDN URL — no deref needed. `lqip` and
 * `dimensions` only come from the asset document's `metadata`, so they stay
 * `undefined` here: `SanityImage` renders fine without them (no blur-up
 * placeholder; explicit `width`/`height` props still apply).
 */
export function toPortableTextImage(
  block: BodyImage,
): ISanityImage | undefined {
  const assetId = block.asset?._ref;
  if (!assetId) return undefined;

  return {
    assetId,
    alt: block.alt ?? '',
    hotspot: toHotspot(block.hotspot),
    crop: toCrop(block.crop),
    lqip: undefined,
    dimensions: undefined,
  };
}
