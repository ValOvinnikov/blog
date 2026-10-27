import { RuleTester } from 'eslint';

import { noNodeAccessRule } from './no-node-access.js';

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  settings: { 'testing-library/utils-module': 'testing/custom-render' },
});

const RTL_IMPORT = "import { screen } from '@testing-library/react';\n";
const WRAPPER_IMPORT = "import { screen } from '@web/testing/custom-render';\n";
const CHAINED = { messageId: 'noChainedNodeAccess' };

ruleTester.run('no-node-access', noNodeAccessRule, {
  valid: [
    { code: `${RTL_IMPORT}const id = el.id;` },
    { code: `${RTL_IMPORT}const name = props.children.length;` },
    { code: 'const text = block.children[0].text;' },
    { code: `${RTL_IMPORT}const first = rows[0].id;` },
  ],
  invalid: [
    { code: `${RTL_IMPORT}const id = el.parentElement.id;`, errors: [CHAINED] },
    { code: `${RTL_IMPORT}const first = el.children[0];`, errors: [CHAINED] },
    {
      code: `${WRAPPER_IMPORT}expect(el.firstChild.textContent).toBe('a');`,
      errors: [CHAINED],
    },
    {
      code: `${RTL_IMPORT}const parent = el.parentElement;`,
      errors: [{ messageId: 'noNodeAccess' }],
    },
  ],
});
