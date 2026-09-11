import {
  SEO_META_TITLE_MAX_LENGTH,
  SEO_META_TITLE_MIN_LENGTH,
} from '@blog/config';

/**
 * Pure title-construction helpers for the `seo.metaTitle` backfill. Kept
 * dependency-free (no `sanity/migrate` imports) so they're testable without a
 * migration context.
 */
const clampToMax = (text: string): string =>
  text.length > SEO_META_TITLE_MAX_LENGTH
    ? text.slice(0, SEO_META_TITLE_MAX_LENGTH).trimEnd()
    : text;

const isWithinRange = (text: string): boolean =>
  text.length >= SEO_META_TITLE_MIN_LENGTH;

/**
 * Appends `pads` to `subject` one at a time, in order, until the result
 * clears `SEO_META_TITLE_MIN_LENGTH`; returns `undefined` when every pad is
 * exhausted and it's still short, rather than returning an invalid title.
 */
const composeWithPads = (
  subject: string,
  pads: readonly (string | undefined)[],
): string | undefined => {
  let candidate = subject;

  for (const pad of pads) {
    if (isWithinRange(candidate)) break;

    const trimmedPad = pad?.trim();

    if (trimmedPad) candidate = `${candidate} — ${trimmedPad}`;
  }

  return isWithinRange(candidate) ? clampToMax(candidate) : undefined;
};

/**
 * `page_post` / `page_landing`: subject is the document's own heading,
 * padded with the brand name and then, if still short, the site tagline.
 */
export const buildHeadingMetaTitle = (
  heading: string,
  brandName: string,
  tagline?: string,
): string | undefined => composeWithPads(heading.trim(), [brandName, tagline]);

/**
 * `page_home` / `page_blog` / `page_tagIndex` / `page_topicIndex`: singletons
 * whose own heading is a bare word ("Home", "Blog", "Tags", "Topics"), padded
 * with the site tagline/description and then, if still short, the brand name.
 */
export const buildIndexPageMetaTitle = (
  heading: string,
  padText: string,
  brandName?: string,
): string | undefined => composeWithPads(heading.trim(), [padText, brandName]);

/**
 * `page_tag` / `page_topic`: subject is the page's own heading when
 * authored, else the referenced `blog_tag`/`blog_topic` title, padded with
 * what the page lists and then, if still short, the site tagline.
 */
export const buildEntityPageMetaTitle = (
  subject: string,
  brandName: string,
  tagline?: string,
): string | undefined =>
  composeWithPads(subject.trim(), [`Articles on ${brandName.trim()}`, tagline]);
