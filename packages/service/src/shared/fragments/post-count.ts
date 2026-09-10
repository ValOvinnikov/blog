import { PUBLISHED_POST_FILTER } from '@blog/service/shared/filters/published-post';
import { z } from 'zod';

/**
 * Counts the published `page_post` documents referencing the enclosing
 * document — `^._id` correlates each post back to the term (topic/tag) this
 * projection runs against. `references()` matches regardless of whether the
 * referencing field is a single reference or (as `page_post.tags` is) an
 * array of them.
 */
export const POST_COUNT_EXPRESSION = `count(*[_type == "page_post" && references(^._id) && ${PUBLISHED_POST_FILTER}])`;

export const postCountParser = z.number();
