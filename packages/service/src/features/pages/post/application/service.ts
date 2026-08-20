import { getPost } from '@blog/service/features/pages/post/adaptor/detail-page/loader';
import { getPostParams } from '@blog/service/features/pages/post/adaptor/detail-page-params/loader';
import { safeAsync } from '@blog/utils';

export function createPostService() {
  return {
    v1: {
      // Loader still returns `TPostDetail | null` for "post not found";
      // safeAsync only wraps arbitrary query failures, so callers check
      // `.ok` first, then `.data !== null`. A `.notNull()` fragment field on
      // a `slice(0)` query with no matching document makes groqd's
      // `.parse()` throw rather than resolve, so `getPost`'s own
      // `if (!raw) return null` never runs — safeAsync is what turns that
      // throw into a clean `ok: false` instead of an uncaught crash.
      getPost: safeAsync((slug: string) => getPost(slug)),
      getPostParams: safeAsync(() => getPostParams()),
    },
  };
}
