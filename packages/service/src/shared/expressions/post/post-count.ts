import { POST_IN_LOCALE_FILTER } from '@blog/service/shared/expressions/post/post-in-locale';
import { PUBLISHED_POST_FILTER } from '@blog/service/shared/expressions/post/published-post';
import { z } from 'zod';

export const POST_COUNT_EXPRESSION = `count(*[_type == "page_post" && references(^._id) && ${POST_IN_LOCALE_FILTER} && ${PUBLISHED_POST_FILTER}])`;

export const postCountParser = z.number();
