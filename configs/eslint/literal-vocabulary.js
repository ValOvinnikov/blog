export const PROTOCOL_ATTRIBUTE_KEYS = new Set(['sameSite']);
export const PROTOCOL_ATTRIBUTE_VALUES = new Map([
  ['target', new Set(['_blank'])],
]);
export const EQUALITY_OPERATORS = new Set(['===', '!==', '==', '!=']);
export const ENV_OBJECT_NAME = 'env';
export const PROCESS_NAME = 'process';
export const STUB_ENV_CALLEE = 'stubEnv';
export const SANITY_TYPE_KEY = '_type';
export const ROLE_QUERY_CALLEES = new Set([
  'getByRole',
  'getAllByRole',
  'queryByRole',
  'queryAllByRole',
  'findByRole',
  'findAllByRole',
]);
