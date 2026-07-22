import { getAuthor } from '@blog/service/features/entities/author/adaptor/detail-page/loader';
import { getAuthorParams } from '@blog/service/features/entities/author/adaptor/detail-page-params/loader';
import { getAuthorPage } from '@blog/service/features/entities/author/adaptor/page/loader';
import { getAuthorPosts } from '@blog/service/features/entities/author/adaptor/posts/loader';

export function createAuthorService() {
  return {
    v1: { getAuthor, getAuthorPage, getAuthorParams, getAuthorPosts },
  };
}
