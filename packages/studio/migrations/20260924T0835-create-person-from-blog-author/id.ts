import { withPrefix } from '../lib/with-prefix';

const PERSON_PREFIX = 'person-';

/** Fixed `person` id derived from the `blog_author` it represents. */
export const toPersonId = (authorId: string): string =>
  withPrefix(authorId, PERSON_PREFIX);
