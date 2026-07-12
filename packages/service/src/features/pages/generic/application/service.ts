import { safeAsync } from '@blog/utils';

import { getPage } from '../adaptor/loader';

export function createGenericPageService() {
  return {
    v1: { getPage: (slug: string) => safeAsync(getPage(slug)) },
  };
}
