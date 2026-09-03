const TARGET_COMPONENTS = new Set(['TextInput', 'Textarea']);
const LABELLING_ANCESTOR_COMPONENT = 'FormField';
const OPT_OUT_ATTRIBUTES = new Set(['ariaLabel', 'hasExternalLabel']);

function getElementName(openingElement) {
  if (openingElement.name.type === 'JSXIdentifier') {
    return openingElement.name.name;
  }
  return null;
}

function getAttributeNames(openingElement) {
  const names = new Set();
  for (const attr of openingElement.attributes) {
    if (attr.type === 'JSXAttribute' && attr.name.type === 'JSXIdentifier') {
      names.add(attr.name.name);
    }
  }
  return names;
}

function hasLabellingFormFieldAncestor(ancestors) {
  for (let i = ancestors.length - 1; i >= 0; i -= 1) {
    const ancestor = ancestors[i];
    if (ancestor.type !== 'JSXElement') {
      continue;
    }
    if (
      getElementName(ancestor.openingElement) !== LABELLING_ANCESTOR_COMPONENT
    ) {
      continue;
    }
    return getAttributeNames(ancestor.openingElement).has('htmlFor');
  }
  return false;
}

/**
 * Requires every `<TextInput>`/`<Textarea>` to have an accessible name:
 * `ariaLabel`, a `FormField` ancestor with `htmlFor` (which renders the
 * `<label htmlFor>`), or an explicit `hasExternalLabel` opt-out for the case
 * where a sibling component renders the associated `<label>`. A syntactic
 * check — it cannot see whether a `hasExternalLabel` claim is actually true,
 * only that the caller made a deliberate choice instead of an omission.
 */
export const textInputTextareaAccessibleNameRule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'TextInput/Textarea must have an accessible name (ariaLabel, a FormField ancestor with htmlFor, or hasExternalLabel).',
    },
    schema: [],
    messages: {
      missingAccessibleName:
        "'<{{name}}>' has no accessible name — pass ariaLabel, render it inside a FormField with htmlFor, or pass hasExternalLabel when a sibling component renders its <label htmlFor>.",
    },
  },
  create(context) {
    return {
      JSXOpeningElement(node) {
        const name = getElementName(node);
        if (!name || !TARGET_COMPONENTS.has(name)) {
          return;
        }

        const attrNames = getAttributeNames(node);
        const hasOptOut = [...OPT_OUT_ATTRIBUTES].some((attr) =>
          attrNames.has(attr),
        );
        if (hasOptOut) {
          return;
        }

        if (
          hasLabellingFormFieldAncestor(context.sourceCode.getAncestors(node))
        ) {
          return;
        }

        context.report({
          node,
          messageId: 'missingAccessibleName',
          data: { name },
        });
      },
    };
  },
};
