import { getPost } from '@blog/service/features/pages/post/adaptor/detail-page/loader';
import { getPostParams } from '@blog/service/features/pages/post/adaptor/detail-page-params/loader';
import { safeAsync } from '@blog/utils';

export function createPostService() {
  return {
    v1: {
      // Loader still returns `TPostDetail | null` for "post not found";
      // safeAsync only wraps arbitrary query failures, so callers check
      // `.ok` first, then `.data !== null` (see #713). A `.notNull()`
      // fragment field on a `slice(0)` query that resolves to `null` (no
      // matching document) makes groqd's `.parse()` throw rather than
      // resolve — `getPost`'s own `if (!raw) return null` never actually
      // runs in that case, so unwrapped, this throw reached the page
      // uncaught and crashed the render (a broken 500 instead of a clean
      // 404, #889). topic/tag/author already wrapped their loaders the
      // same way; post was the one exception.
      getPost: safeAsync((slug: string) => getPost(slug)),
      getPostParams: safeAsync(() => getPostParams()),
    },
  };
}
