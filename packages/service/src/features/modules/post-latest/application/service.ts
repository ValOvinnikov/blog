import { getPostLatest } from '@blog/service/features/modules/post-latest/adaptor/loader';
import { safeAsync } from '@blog/utils';

export function createPostLatestModuleService() {
  return {
    v1: { getPostLatest: safeAsync((id: string) => getPostLatest(id)) },
  };
}
