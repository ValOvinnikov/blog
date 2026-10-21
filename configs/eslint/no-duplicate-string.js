import sonarjs from 'eslint-plugin-sonarjs';

import { isClassString } from './prefer-shared-constant.js';

const sonarRule = sonarjs.rules['no-duplicate-string'];

export const noDuplicateStringRule = {
  meta: sonarRule.meta,
  create(context) {
    const listeners = sonarRule.create(context);
    return {
      ...listeners,
      Literal(node) {
        if (!isClassString(node)) {
          listeners.Literal(node);
        }
      },
    };
  },
};
