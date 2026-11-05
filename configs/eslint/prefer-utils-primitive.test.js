import { RuleTester } from 'eslint';

import { preferUtilsPrimitiveRule } from './prefer-utils-primitive.js';

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 'latest', sourceType: 'module' },
});

const WEB_SOURCE = '/repo/apps/web/src/proxy.ts';
const UTILS_SOURCE = '/repo/packages/utils/src/primitives/undefined.ts';
const INSIGHT_SOURCE = '/repo/packages/insight/src/logger.ts';
const GENERATED_SOURCE = '/repo/packages/config/src/sanity/generated/types.ts';

const helperError = (helper) => ({
  messageId: 'preferUtilsPrimitive',
  data: { helper, module: '@blog/utils/primitives' },
});

const invalid = (code, helper) => ({
  code,
  filename: WEB_SOURCE,
  errors: [helperError(helper)],
});

ruleTester.run('prefer-utils-primitive', preferUtilsPrimitiveRule, {
  valid: [
    { code: 'const missing = isUndefined(value);', filename: WEB_SOURCE },
    { code: 'const empty = isNull(value);', filename: WEB_SOURCE },
    { code: 'const text = isString(value);', filename: WEB_SOURCE },
    { code: 'const any = hasLength(items);', filename: WEB_SOURCE },
    {
      code: "const numeric = typeof value === 'number';",
      filename: WEB_SOURCE,
    },
    { code: 'const loose = value == null;', filename: WEB_SOURCE },
    {
      code: 'const many = hasArrayGotMultipleItems(items);',
      filename: WEB_SOURCE,
    },
    { code: 'const few = items.length < 2;', filename: WEB_SOURCE },
    { code: 'const single = items.length === 1;', filename: WEB_SOURCE },
    { code: 'const short = items.length < 3;', filename: WEB_SOURCE },
    { code: 'const size = items.length === 2;', filename: WEB_SOURCE },
    { code: 'const sized = set.size === 0;', filename: WEB_SOURCE },
    { code: 'const literal = `a`.length === 0;', filename: WEB_SOURCE },
    { code: 'const empty = items?.length === 0;', filename: WEB_SOURCE },
    { code: 'const any = items?.length !== 0;', filename: WEB_SOURCE },
    { code: 'const missing = value === undefined;', filename: UTILS_SOURCE },
    { code: 'const empty = items.length === 0;', filename: INSIGHT_SOURCE },
    {
      code: 'const missing = value === undefined;',
      filename: GENERATED_SOURCE,
    },
    {
      code: 'const missing = value === undefined;',
      filename: '/repo/scripts/a.ts',
    },
  ],
  invalid: [
    invalid('const missing = value === undefined;', 'isUndefined'),
    invalid('const present = value !== undefined;', 'isUndefined'),
    invalid('const missing = undefined === value;', 'isUndefined'),
    invalid('const missing = props.title === undefined;', 'isUndefined'),
    invalid('const empty = value === null;', 'isNull'),
    invalid('const set = null !== value;', 'isNull'),
    invalid("const text = typeof value === 'string';", 'isString'),
    invalid("const other = 'string' !== typeof value;", 'isString'),
    invalid('const empty = items.length === 0;', 'hasLength'),
    invalid('const any = items.length > 0;', 'hasLength'),
    invalid('const any = items.length !== 0;', 'hasLength'),
    invalid('const any = 0 < items.length;', 'hasLength'),
    invalid('const any = items?.length > 0;', 'hasLength'),
    invalid('const many = items.length > 1;', 'hasArrayGotMultipleItems'),
    invalid('const many = 1 < items.length;', 'hasArrayGotMultipleItems'),
    invalid('const many = items?.length > 1;', 'hasArrayGotMultipleItems'),
  ],
});
