const TARGET_COMPONENTS = new Set(['TextInput', 'Textarea']);
const FORM_FIELD_COMPONENT = 'FormField';
const FIELD_ROOT_COMPONENT = 'Field.Root';

function getElementName(openingElement) {
  const { name } = openingElement;
  if (name.type === 'JSXIdentifier') {
    return name.name;
  }
  if (
    name.type === 'JSXMemberExpression' &&
    name.object.type === 'JSXIdentifier'
  ) {
    return `${name.object.name}.${name.property.name}`;
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

function hasLabellingFieldAncestor(ancestors) {
  for (let i = ancestors.length - 1; i >= 0; i -= 1) {
    const ancestor = ancestors[i];
    if (ancestor.type !== 'JSXElement') {
      continue;
    }
    const name = getElementName(ancestor.openingElement);
    if (name === FIELD_ROOT_COMPONENT) {
      return true;
    }
    if (name === FORM_FIELD_COMPONENT) {
      return !getAttributeNames(ancestor.openingElement).has(
        'hasOwnAccessibleName',
      );
    }
  }
  return false;
}

/**
 * Requires every `<TextInput>`/`<Textarea>` to have an accessible name:
 * `ariaLabel`, or a `FormField` or Base UI `Field.Root` ancestor whose
 * `Field.Label` names it. A syntactic check — it cannot see whether a
 * `Field.Root` actually renders a `Field.Label`.
 */
export const textInputTextareaAccessibleNameRule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'TextInput/Textarea must have an accessible name (ariaLabel, or a FormField or Field.Root ancestor).',
    },
    schema: [],
    messages: {
      missingAccessibleName:
        "'<{{name}}>' has no accessible name — pass ariaLabel, or render it inside a FormField (without hasOwnAccessibleName) or a Field.Root with a Field.Label.",
    },
  },
  create(context) {
    return {
      JSXOpeningElement(node) {
        const name = getElementName(node);
        if (!name || !TARGET_COMPONENTS.has(name)) {
          return;
        }

        if (getAttributeNames(node).has('ariaLabel')) {
          return;
        }

        if (hasLabellingFieldAncestor(context.sourceCode.getAncestors(node))) {
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
