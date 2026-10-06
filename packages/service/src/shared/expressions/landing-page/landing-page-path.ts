import { LANDING_PAGE_MAX_DEPTH } from '@blog/config/constants';
import { z } from 'zod';

function ancestor(hops: number): string {
  return 'parent->'.repeat(hops);
}

const levels = Array.from(
  { length: LANDING_PAGE_MAX_DEPTH },
  (_, hops) => hops,
);

const segments = [...levels]
  .reverse()
  .map((hops) => `${ancestor(hops)}slug.current`);

// A dangling parent (deleted, unpublished or slugless) or a chain past the bound leaves the page with no path rather than a shorter, wrong one.
const unroutable = [
  ...levels
    .slice(1)
    .map(
      (hops) =>
        `(defined(${ancestor(hops - 1)}parent) && !defined(${ancestor(hops)}slug.current))`,
    ),
  `defined(${ancestor(LANDING_PAGE_MAX_DEPTH - 1)}parent)`,
];

export const LANDING_PAGE_PATH_EXPRESSION = `select(${unroutable.join(' || ')} => null, array::join(array::compact([${segments.join(', ')}]), "/"))`;

export const PAGE_PATH_EXPRESSION = `select(_type == "page_landing" => ${LANDING_PAGE_PATH_EXPRESSION}, slug.current)`;

export const pagePathParser = z.string().nullable();
