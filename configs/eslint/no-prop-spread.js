const POLYMORPHIC_ALLOWLIST = [
  'atoms/eyebrow/eyebrow.tsx',
  'atoms/nav-link/nav-link.tsx',
  'atoms/prose-link/prose-link.tsx',
  'atoms/tag/tag.tsx',
  'molecules/link-button/link-button.tsx',
  'molecules/popover-menu/components/item/popover-menu-item.tsx',
];

function isAllowlisted(filename) {
  const normalized = filename.replaceAll('\\', '/');
  return POLYMORPHIC_ALLOWLIST.some((file) => normalized.endsWith(file));
}

// `.test.tsx`/`.stories.tsx` files spread test fixtures onto local mock
// components (simulating a caller-supplied `Link`/router) — not part of
// @blog/ui's public component surface, so they're out of this rule's scope.
function isTestOrStoryFile(filename) {
  return /\.(?:test|stories)\.tsx$/.test(filename);
}

/**
 * Bans `{...rest}`/`{...props}` spread onto a JSX element in `@blog/ui`
 * component source. Polymorphic components that forward props to a
 * caller-chosen `as` element are the sole exception — listed explicitly
 * rather than inferred from `TPolymorphicProps`, since not every polymorphic
 * component is built from it (see `atoms/eyebrow/eyebrow.tsx`).
 */
export const noPropSpreadRule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        '@blog/ui components declare closed prop types — never spread onto a JSX element.',
    },
    schema: [],
    messages: {
      noSpread:
        '@blog/ui components use closed prop types — enumerate props explicitly instead of spreading onto a JSX element.',
    },
  },
  create(context) {
    const filename = context.filename;

    if (isTestOrStoryFile(filename) || isAllowlisted(filename)) {
      return {};
    }

    return {
      JSXSpreadAttribute(node) {
        context.report({ node, messageId: 'noSpread' });
      },
    };
  },
};
