import { withPrefix } from '../lib/with-prefix';

const SECTION_PAGES_PREFIX = 'sectionPages-';

export const toSectionPagesId = (childPagesId: string): string =>
  withPrefix(childPagesId, SECTION_PAGES_PREFIX);
