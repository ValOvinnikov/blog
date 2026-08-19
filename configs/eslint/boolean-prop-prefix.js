const PROPS_TYPE_NAME = /^[TI][A-Za-z0-9]*Props$/;
const ALLOWED_PREFIX = /^(?:is|has|can|should)(?:[A-Z]|$)/;
// Third-party passthrough props this repo doesn't control the naming of
// (next/link, next/image).
const ALLOWLISTED_NAMES = new Set(['prefetch', 'priority']);

function getPropertyName(key) {
  if (key.type === 'Identifier') {
    return key.name;
  }
  if (key.type === 'Literal' && typeof key.value === 'string') {
    return key.value;
  }
  return null;
}

function isBooleanTypeAnnotation(typeNode) {
  if (!typeNode) {
    return false;
  }
  if (typeNode.type === 'TSBooleanKeyword') {
    return true;
  }
  if (typeNode.type === 'TSUnionType') {
    return typeNode.types.some(isBooleanTypeAnnotation);
  }
  return false;
}

// Collects members from every `TSTypeLiteral` reachable through nested
// intersections (`A & B & { ... }`) — this repo's prop types are commonly
// composed that way, and only the inline object-literal parts are
// statically checkable; imported type references are skipped.
function collectTypeLiteralMembers(typeNode, members) {
  if (!typeNode) {
    return;
  }
  if (typeNode.type === 'TSTypeLiteral') {
    members.push(...typeNode.members);
    return;
  }
  if (typeNode.type === 'TSIntersectionType') {
    for (const part of typeNode.types) {
      collectTypeLiteralMembers(part, members);
    }
  }
}

function checkMembers(members, typeName, context) {
  for (const member of members) {
    if (member.type !== 'TSPropertySignature' || !member.typeAnnotation) {
      continue;
    }

    const name = getPropertyName(member.key);
    if (!name || ALLOWLISTED_NAMES.has(name)) {
      continue;
    }

    if (!isBooleanTypeAnnotation(member.typeAnnotation.typeAnnotation)) {
      continue;
    }

    if (ALLOWED_PREFIX.test(name)) {
      continue;
    }

    context.report({
      node: member.key,
      messageId: 'booleanPropPrefix',
      data: { name, typeName },
    });
  }
}

/**
 * Requires boolean-typed members of `T*Props`/`I*Props` declarations to
 * start with `is`/`has`/`can`/`should`. A syntactic check on the declared
 * annotation, scoped to prop-type declarations by name — this repo's props
 * are always explicitly annotated, and scoping by enclosing type name is how
 * this stays clear of unrelated booleans like a `Result` discriminant's `ok`.
 * An indexed access into a `tv()` variants type (e.g. `TFooVariants['bar']`)
 * resolves to `boolean` at runtime but isn't caught here — closing that gap
 * needs type-aware linting, which `base.js` deliberately doesn't enable.
 */
export const booleanPropPrefixRule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Boolean props on T*Props/I*Props must start with is/has/can/should.',
    },
    schema: [],
    messages: {
      booleanPropPrefix:
        "Boolean prop '{{name}}' on '{{typeName}}' must start with is/has/can/should (e.g. isOpen, hasIcon, canSubmit, shouldRender).",
    },
  },
  create(context) {
    return {
      TSTypeAliasDeclaration(node) {
        if (!PROPS_TYPE_NAME.test(node.id.name)) {
          return;
        }
        const members = [];
        collectTypeLiteralMembers(node.typeAnnotation, members);
        checkMembers(members, node.id.name, context);
      },
      TSInterfaceDeclaration(node) {
        if (!PROPS_TYPE_NAME.test(node.id.name)) {
          return;
        }
        checkMembers(node.body.body, node.id.name, context);
      },
    };
  },
};
