const TARGET_NAMES = new Set(['TextInput', 'Textarea']);
const ACCESSIBLE_NAME_ATTRIBUTES = new Set(['ariaLabel', 'hasExternalLabel']);

function hasAccessibleNameAttribute(node) {
  return node.attributes.some(
    (attribute) =>
      attribute.type === 'JSXAttribute' &&
      attribute.name.type === 'JSXIdentifier' &&
      ACCESSIBLE_NAME_ATTRIBUTES.has(attribute.name.name),
  );
}

function hasFormFieldAncestor(context, node) {
  return context.sourceCode
    .getAncestors(node)
    .some(
      (ancestor) =>
        ancestor.type === 'JSXElement' &&
        ancestor.openingElement.name.type === 'JSXIdentifier' &&
        ancestor.openingElement.name.name === 'FormField',
    );
}

/**
 * Requires every `TextInput`/`Textarea` element to have an accessible name:
 * an `ariaLabel` attribute, a `FormField` JSX ancestor in the same file (it
 * renders the `<label htmlFor>`), or an explicit `hasExternalLabel` attribute
 * declaring that a different component supplies the label. A syntactic check
 * by JSX tag name only, matching this repo's other custom ESLint rules — it
 * can't see a label rendered in a sibling file, which is exactly what
 * `hasExternalLabel` is for.
 */
export const textInputTextareaAccessibleNameRule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'TextInput/Textarea must have an accessible name via ariaLabel, an enclosing FormField, or hasExternalLabel.',
    },
    schema: [],
    messages: {
      missingAccessibleName:
        "'{{name}}' has no accessible name. Add 'ariaLabel', render it inside a 'FormField' (which provides a <label htmlFor>), or pass 'hasExternalLabel' when a different component supplies the label.",
    },
  },
  create(context) {
    return {
      JSXOpeningElement(node) {
        if (
          node.name.type !== 'JSXIdentifier' ||
          !TARGET_NAMES.has(node.name.name)
        ) {
          return;
        }

        if (
          hasAccessibleNameAttribute(node) ||
          hasFormFieldAncestor(context, node)
        ) {
          return;
        }

        context.report({
          node,
          messageId: 'missingAccessibleName',
          data: { name: node.name.name },
        });
      },
    };
  },
};
