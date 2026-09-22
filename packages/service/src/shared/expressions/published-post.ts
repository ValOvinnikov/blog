/**
 * A `page_post` is not publicly visible until its scheduled `publishedAt`
 * date has arrived.
 */
export const PUBLISHED_POST_FILTER = 'publishedAt <= now()';
