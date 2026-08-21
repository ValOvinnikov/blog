import { getTags } from '@blog/service/features/entities/tags/adaptor/loader';
import { safeAsync } from '@blog/utils';

export function createTagsService() {
  return {
    v1: { getTags: safeAsync(() => getTags()) },
  };
}
