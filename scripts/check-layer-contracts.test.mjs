import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  blogDependencies,
  findMismatches,
  parseClaudeDiagram,
  parseSpecTable,
} from './check-layer-contracts.mjs';

const NAMES = new Set(['web', 'config', 'utils', 'db', 'insight']);

const SPEC_FIXTURE = `
## 4. Workspace map & layer contracts

| Layer          | Imports                                                     | Exposes |
| -------------- | ----------------------------------------------------------- | ------- |
| \`@blog/config\` | \`utils\`, \`@portabletext/types\` (types only)                 | x       |
| \`@blog/utils\`  | \`culori\` (OKLCH color math)                                 | x       |
| \`@blog/db\`     | \`config\`, \`utils\`, Drizzle (+ \`@blog/insight\`'s \`fn\`, scoped¹) | x       |
| \`@blog/insight\` | —                                                          | x       |
| \`web\` (app)    | \`db\`, \`config\`, utils                                       | x       |

## 5. Next
| \`@blog/utils\` | \`config\` | x |
`;

const CLAUDE_FIXTURE = `
## Layer contracts (do not violate)

\`\`\`
web → db, config, utils                     configs/* → consumed by all
db → config, utils (no React/Sanity)        config → utils (OKLCH maths)
insight → nothing (base of graph)           utils → nothing (base of graph)
graph is acyclic
\`\`\`

## Next
`;

const workspace = (name, deps) => ({
  name,
  pkg: {
    dependencies: Object.fromEntries(
      deps.map((dep) => [`@blog/${dep}`, 'workspace:*']),
    ),
  },
});

const MATCHING_WORKSPACES = [
  workspace('web', ['config', 'db', 'utils', 'tailwind-config']),
  workspace('config', ['utils']),
  workspace('utils', []),
  workspace('db', ['config', 'utils', 'insight']),
  workspace('insight', []),
];

const check = (workspaces, spec = SPEC_FIXTURE, claude = CLAUDE_FIXTURE) =>
  findMismatches({
    workspaces,
    specRows: parseSpecTable(spec, NAMES),
    diagramRows: parseClaudeDiagram(claude, NAMES),
  });

describe('blogDependencies', () => {
  it('keeps runtime workspace dependencies and drops config packages and dev dependencies', () => {
    assert.deepEqual(
      blogDependencies({
        dependencies: {
          '@blog/utils': 'workspace:*',
          '@blog/tailwind-config': 'workspace:*',
          react: '19.0.0',
        },
        devDependencies: { '@blog/config': 'workspace:*' },
      }),
      ['utils'],
    );
  });
});

describe('parseSpecTable', () => {
  it('reads only the section 4 table, splitting scoped exceptions from plain imports', () => {
    const rows = parseSpecTable(SPEC_FIXTURE, NAMES);
    assert.deepEqual(rows.get('db'), {
      imports: ['config', 'utils'],
      scoped: ['insight'],
    });
    assert.deepEqual(rows.get('utils'), { imports: [], scoped: [] });
    assert.deepEqual(rows.get('web').imports, ['config', 'db', 'utils']);
  });
});

describe('parseClaudeDiagram', () => {
  it('reads both columns of each diagram line and ignores non-workspace targets', () => {
    const rows = parseClaudeDiagram(CLAUDE_FIXTURE, NAMES);
    assert.deepEqual(rows.get('config'), ['utils']);
    assert.deepEqual(rows.get('utils'), []);
    assert.equal(rows.has('configs/*'), false);
  });
});

describe('findMismatches', () => {
  it('passes when package.json, the table and the diagram agree', () => {
    assert.deepEqual(check(MATCHING_WORKSPACES), []);
  });

  it('reports a package.json dependency the table does not list', () => {
    const workspaces = MATCHING_WORKSPACES.map((entry) =>
      entry.name === 'utils' ? workspace('utils', ['insight']) : entry,
    );
    assert.deepEqual(check(workspaces), [
      'utils: SPEC.md §4 table is missing insight',
    ]);
  });

  it('reports a table import the diagram leaves out', () => {
    const claude = CLAUDE_FIXTURE.replace(
      'web → db, config, utils',
      'web → db, config       ',
    );
    assert.deepEqual(check(MATCHING_WORKSPACES, SPEC_FIXTURE, claude), [
      'web: CLAUDE.md diagram is missing utils',
    ]);
  });

  it('names the expected line when a workspace has none in the diagram', () => {
    const claude = CLAUDE_FIXTURE.replace('config → utils (OKLCH maths)', '');
    assert.deepEqual(check(MATCHING_WORKSPACES, SPEC_FIXTURE, claude), [
      'config: no line in the CLAUDE.md layer diagram; expected "config → utils"',
    ]);
  });

  it('reports a workspace with no table row', () => {
    assert.deepEqual(
      check([...MATCHING_WORKSPACES, workspace('email', ['utils'])]),
      ['email: no row in the SPEC.md §4 table'],
    );
  });
});
