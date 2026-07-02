import { q } from '#/sanity/query';

export const imageWithAltFragment = q.fragmentForType<'imageWithAlt'>().project({
  _type: true,
  asset: true,
  alt: true,
  hotspot: true,
  crop: true,
});
