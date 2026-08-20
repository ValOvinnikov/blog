import { getTopics } from '@blog/service/features/entities/topics/adaptor/loader';
import { safeAsync } from '@blog/utils';

export function createTopicsService() {
  return {
    v1: { getTopics: safeAsync(() => getTopics()) },
  };
}
