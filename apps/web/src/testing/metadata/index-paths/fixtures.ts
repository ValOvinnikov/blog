import { routes } from '@blog/config';
import { NL_PATH_PREFIX } from '@web/testing/metadata/to-metadata/fixtures';

export const NL_TOPICS_INDEX_PATH = `${NL_PATH_PREFIX}${routes.topics()}`;

export const NL_TAGS_INDEX_PATH = `${NL_PATH_PREFIX}${routes.tags()}`;
