import sonarjs from 'eslint-plugin-sonarjs';

import {
  ENV_OBJECT_NAME,
  EQUALITY_OPERATORS,
  PROCESS_NAME,
  PROTOCOL_ATTRIBUTE_KEYS,
  ROLE_QUERY_CALLEES,
  STUB_ENV_CALLEE,
} from './literal-vocabulary.js';
import { isClassString } from './prefer-shared-constant.js';

const sonarRule = sonarjs.rules['no-duplicate-string'];

const isEnvObject = (expression) =>
  (expression.type === 'Identifier' && expression.name === ENV_OBJECT_NAME) ||
  (expression.type === 'MemberExpression' &&
    !expression.computed &&
    expression.property.name === ENV_OBJECT_NAME &&
    expression.object.type === 'Identifier' &&
    expression.object.name === PROCESS_NAME);

const isEnvRead = (expression) =>
  expression.type === 'MemberExpression' && isEnvObject(expression.object);

const isEnvComparisonOperand = ({ parent }) =>
  parent.type === 'BinaryExpression' &&
  EQUALITY_OPERATORS.has(parent.operator) &&
  (isEnvRead(parent.left) || isEnvRead(parent.right));

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
  return (
    parent.type === 'Property' &&
    parent.value === node &&
    !parent.computed &&
    PROTOCOL_ATTRIBUTE_KEYS.has(parent.key.name ?? parent.key.value)
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
