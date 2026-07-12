import { getAuthor } from '@blog/service/features/entities/author/adaptor/detail/loader';
import { getAuthorParams } from '@blog/service/features/entities/author/adaptor/params/loader';

export function createAuthorService() {
  return {
    v1: { getAuthor, getAuthorParams },
  };
}
