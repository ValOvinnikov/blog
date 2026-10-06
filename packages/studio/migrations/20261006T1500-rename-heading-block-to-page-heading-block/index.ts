import { at, defineMigration, set } from 'sanity/migrate';

const LEGACY_TYPE = 'headingBlock';
const TARGET_TYPE = 'pageHeadingBlock';

type THeadingBlockNode = { _type?: unknown; [key: string]: unknown };

export const renamePageHeadingBlockType = (node: THeadingBlockNode) =>
  node._type === LEGACY_TYPE ? at('_type', set(TARGET_TYPE)) : undefined;

export default defineMigration({
  title: 'Rename headingBlock to pageHeadingBlock',
  documentTypes: [
    'page_home',
    'page_landing',
    'page_post',
    'page_postIndex',
    'page_tag',
    'page_tagIndex',
    'page_topic',
    'page_topicIndex',
  ],
  migrate: {
    object(node) {
      return renamePageHeadingBlockType(node);
    },
  },
});
