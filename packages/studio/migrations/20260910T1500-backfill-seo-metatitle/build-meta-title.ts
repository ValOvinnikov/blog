/**
 * Pure title-construction helpers for the `seo.metaTitle` backfill. Kept
 * dependency-free (no `sanity/migrate` imports) so they're testable without a
 * migration context. Must stay in sync with `../../src/schema-types/objects/seo.ts`'s
 * `SEO_META_TITLE_MIN_LENGTH` / `SEO_META_TITLE_MAX_LENGTH` — duplicated here
 * rather than imported, matching this repo's convention of keeping migrations
 * self-contained from the schema module graph.
 */
export const META_TITLE_MIN_LENGTH = 30;
export const META_TITLE_MAX_LENGTH = 60;

const clampToMax = (text: string): string =>
  text.length > META_TITLE_MAX_LENGTH
    ? text.slice(0, META_TITLE_MAX_LENGTH).trimEnd()
    : text;

const isWithinRange = (text: string): boolean =>
  text.length >= META_TITLE_MIN_LENGTH;

/**
 * `page_post`: `headingBlock.heading` is required on every post, so it's
 * always a real, meaningful subject. Used verbatim when it already clears
 * the floor; padded with the brand name only when it's too short.
 */
export const buildPostMetaTitle = (heading: string, brandName: string): string => {
  const trimmed = heading.trim();

  if (isWithinRange(trimmed)) return clampToMax(trimmed);

  return clampToMax(`${trimmed} — ${brandName}`);
};

/**
 * `page_blog` / `page_tagIndex` / `page_topicIndex`: singletons whose own
 * heading (`headingBlock.heading`) is a bare word ("Blog", "Tags", "Topics")
 * — never long enough alone, so it's paired with the site tagline/description
 * for real, site-specific padding rather than a generic brand suffix.
 */
export const buildIndexPageMetaTitle = (
  heading: string,
  padText: string,
): string => {
  const trimmed = heading.trim();

  if (isWithinRange(trimmed)) return clampToMax(trimmed);

  return clampToMax(`${trimmed} — ${padText.trim()}`);
};

/**
 * `page_tag` / `page_topic`: subject is the page's own `headingBlock.heading`
 * when authored, else the referenced `blog_tag`/`blog_topic` title. Tag/topic
 * names are frequently short (e.g. "SEO"), so the pad phrase names what the
 * page actually lists rather than just repeating the brand.
 */
export const buildEntityPageMetaTitle = (
  subject: string,
  brandName: string,
): string => {
  const trimmed = subject.trim();

  if (isWithinRange(trimmed)) return clampToMax(trimmed);

  return clampToMax(`${trimmed} — Articles on ${brandName}`);
};
