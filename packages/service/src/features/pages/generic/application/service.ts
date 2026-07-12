import { getPage } from '@blog/service/features/pages/generic/adaptor/loader';
import { safeAsync } from '@blog/utils';

export function createGenericPageService() {
  return {
    v1: { getPage: (slug: string) => safeAsync(getPage(slug)) },
  };
}
