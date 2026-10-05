import { z } from 'zod';

export const FIRST_POST_LIST_PAGE_SIZE_EXPRESSION =
  'modules[@->_type == "module_postList"][0]->pageSize';

export const firstPostListPageSizeParser = z.number().nullable();
