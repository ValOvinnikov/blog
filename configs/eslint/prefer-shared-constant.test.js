import { RuleTester } from 'eslint';

import { createPreferSharedConstantRule } from './prefer-shared-constant.js';

const configEntry = (ref, file = 'packages/config/src/constants/x.ts') => ({
  ref,
  scope: 'config',
  from: '@blog/config/constants',
  file,
});

const index = {
  strings: {
    INTERNAL: [
      configEntry(
        'LINK_TYPE.INTERNAL',
        'packages/config/src/constants/link.ts',
      ),
    ],
    'use client': [configEntry('DIRECTIVE.CLIENT')],
    ACTIVE: [
      {
        ref: 'TENANT_STATUS.ACTIVE',
        scope: 'db',
        from: '@blog/db/constants',
        file: 'packages/db/src/constants/tenant.ts',
      },
    ],
    LIGHT: [
      {
        ref: 'PREVIEW_MODE.LIGHT',
        scope: 'app:platform',
        from: '@platform/constants/preview',
        file: 'apps/platform/src/constants/preview.ts',
      },
    ],
  },
  numbers: {
    404: [configEntry('HTTP_STATUS.NOT_FOUND')],
  },
};

const rule = createPreferSharedConstantRule(index);

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

const WEB_SOURCE = '/repo/apps/web/src/proxy.ts';
const WEB_TEST = '/repo/apps/web/src/proxy.test.ts';
const NOT_FOUND = {
  messageId: 'preferSharedConstant',
  data: {
    value: '404',
    consts: 'HTTP_STATUS.NOT_FOUND (@blog/config/constants)',
  },
};
const INTERNAL = {
  messageId: 'preferSharedConstant',
  data: {
    value: "'INTERNAL'",
    consts: 'LINK_TYPE.INTERNAL (@blog/config/constants)',
  },
};

ruleTester.run('prefer-shared-constant', rule, {
  valid: [
    { code: 'const limit = 404;', filename: WEB_SOURCE },
    { code: 'const page = items[404];', filename: WEB_SOURCE },
    { code: "'use client';", filename: WEB_SOURCE },
    { code: "import { x } from 'INTERNAL';", filename: WEB_SOURCE },
    { code: "vi.mock('INTERNAL');", filename: WEB_TEST },
    { code: "const map = { 'INTERNAL': 1 };", filename: WEB_SOURCE },
    { code: 'const el = <a className="INTERNAL" />;', filename: WEB_SOURCE },
    { code: "const classes = cn('INTERNAL');", filename: WEB_SOURCE },
    { code: "const el = <p>{'INTERNAL'}</p>;", filename: WEB_SOURCE },
    {
      code: "expect(img).toHaveAttribute('INTERNAL', 'lazy');",
      filename: WEB_TEST,
    },
    { code: "img.getAttribute('INTERNAL');", filename: WEB_TEST },
    {
      code: "const status = 'INTERNAL';",
      filename: '/repo/packages/utils/src/a.ts',
    },
    { code: "const s = 'ACTIVE';", filename: '/repo/packages/ui/src/a.ts' },
    { code: "const mode = 'LIGHT';", filename: WEB_SOURCE },
    {
      code: "export const LINK_TYPE = { INTERNAL: 'INTERNAL' };",
      filename: '/repo/packages/config/src/constants/link.ts',
    },
    { code: "const s = 'INTERNAL';", filename: '/repo/scripts/a.mjs' },
    {
      code: "const isLive = process.env.NODE_ENV === 'INTERNAL';",
      filename: WEB_SOURCE,
    },
    {
      code: 'export const isMissing = (code) => code === 404;',
      filename: '/repo/packages/config/src/constants/x.ts',
    },
  ],
  invalid: [
    {
      code: 'const response = { status: 404 };',
      filename: WEB_SOURCE,
      errors: [NOT_FOUND],
    },
    { code: 'mock({ status: 404 });', filename: WEB_TEST, errors: [NOT_FOUND] },
    {
      code: 'if (res.status === 404) {}',
      filename: WEB_SOURCE,
      errors: [NOT_FOUND],
    },
    {
      code: 'switch (code) { case 404: break; }',
      filename: WEB_SOURCE,
      errors: [NOT_FOUND],
    },
    {
      code: 'expect(res.status).toBe(404);',
      filename: WEB_TEST,
      errors: [NOT_FOUND],
    },
    {
      code: "const type = 'INTERNAL';",
      filename: WEB_SOURCE,
      errors: [INTERNAL],
    },
    {
      code: "expect(img).toHaveAttribute('data-type', 'INTERNAL');",
      filename: WEB_TEST,
      errors: [INTERNAL],
    },
    {
      code: "render({ type: 'INTERNAL' });",
      filename: WEB_TEST,
      errors: [INTERNAL],
    },
    {
      code: 'const el = <Link type="INTERNAL" />;',
      filename: WEB_SOURCE,
      errors: [INTERNAL],
    },
    {
      code: 'const type = `INTERNAL`;',
      filename: WEB_SOURCE,
      errors: [INTERNAL],
    },
    {
      code: "const s = 'ACTIVE';",
      filename: WEB_SOURCE,
      errors: [
        {
          messageId: 'preferSharedConstant',
          data: {
            value: "'ACTIVE'",
            consts: 'TENANT_STATUS.ACTIVE (@blog/db/constants)',
          },
        },
      ],
    },
    {
      code: "const mode = 'LIGHT';",
      filename: '/repo/apps/platform/src/components/a.ts',
      errors: [
        {
          messageId: 'preferSharedConstant',
          data: {
            value: "'LIGHT'",
            consts: 'PREVIEW_MODE.LIGHT (@platform/constants/preview)',
          },
        },
      ],
    },
  ],
});
