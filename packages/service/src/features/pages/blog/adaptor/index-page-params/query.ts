import { q } from '@blog/service/sanity/query';

/** Count-only query for `generateStaticParams` — no post projection or derefs. */
export const indexPageCountQuery = q.count(q.star.filterByType('blog_post'));
