import sonarjs from 'eslint-plugin-sonarjs';

import { isStandardVocabulary } from './literal-vocabulary.js';
import { isClassString } from './prefer-shared-constant.js';

const sonarRule = sonarjs.rules['no-duplicate-string'];

export const noDuplicateStringRule = {
  meta: sonarRule.meta,
  create(context) {
    const listeners = sonarRule.create(context);
    return {
      ...listeners,
      Literal(node) {
        if (!isClassString(node) && !isStandardVocabulary(node)) {
          listeners.Literal(node);
        }
      },
    };
  },
};
