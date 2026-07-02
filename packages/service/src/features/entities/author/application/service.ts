import { getAuthor } from '../adaptor/detail/loader';
import { getAuthorParams } from '../adaptor/params/loader';

export function createAuthorService() {
  return {
    v1: { getAuthor, getAuthorParams },
  };
}
