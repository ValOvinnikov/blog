/** Renames the legacy inline `link` object's stored `_type` to `inlineLink`. */
import { defineMigration, set } from 'sanity/migrate';

import { renameInlineLinkType, type TInlineLinkNode } from './transform';

export default defineMigration({
  title: 'Rename inline link object type from link to inlineLink',
  documentTypes: [
    'settings_footer',
    'settings_navigation',
    'module_hero',
    'module_heroBlog',
    'module_heroStatement',
  ],
  migrate: {
    object(node, path) {
      const renamed = renameInlineLinkType(
        node as unknown as TInlineLinkNode,
        path,
      );

      return renamed ? set(renamed) : undefined;
    },
  },
});
