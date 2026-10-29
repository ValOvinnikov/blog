import sonarjs from 'eslint-plugin-sonarjs';

import {
  PROTOCOL_ATTRIBUTE_KEYS,
  PROTOCOL_ATTRIBUTE_VALUES,
  ROLE_QUERY_CALLEES,
  STUB_ENV_CALLEE,
} from './literal-vocabulary.js';
import {
  isClassString,
  isEnvComparisonOperand,
} from './prefer-shared-constant.js';

const sonarRule = sonarjs.rules['no-duplicate-string'];

const isStubEnvArgument = ({ parent }) =>
  parent.type === 'CallExpression' &&
  parent.callee.type === 'MemberExpression' &&
  parent.callee.property.name === STUB_ENV_CALLEE;

const isRoleQueryArgument = ({ parent }) =>
  parent.type === 'CallExpression' &&
  ((parent.callee.type === 'Identifier' &&
    ROLE_QUERY_CALLEES.has(parent.callee.name)) ||
    (parent.callee.type === 'MemberExpression' &&
      ROLE_QUERY_CALLEES.has(parent.callee.property.name)));

const isProtocolAttributeValue = (node) => {
  const { parent } = node;
  if (parent.type !== 'Property' || parent.value !== node || parent.computed) {
    return false;
  }
  const key = parent.key.name ?? parent.key.value;
  return (
    PROTOCOL_ATTRIBUTE_KEYS.has(key) ||
    PROTOCOL_ATTRIBUTE_VALUES.get(key)?.has(node.value) === true
  );
};

const isEnvironmentVocabulary = (node) =>
  isEnvComparisonOperand(node) ||
  isStubEnvArgument(node) ||
  isRoleQueryArgument(node) ||
  isProtocolAttributeValue(node);

export const noDuplicateStringRule = {
  meta: sonarRule.meta,
  create(context) {
    const listeners = sonarRule.create(context);
    return {
      ...listeners,
      Literal(node) {
        if (!isClassString(node) && !isEnvironmentVocabulary(node)) {
          listeners.Literal(node);
        }
      },
    };
  },
};
