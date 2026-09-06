// Fixture-based tests for check-client-graph's directive reading, specifier
// extraction, alias resolution and graph walk.
//
// The graph-walk helpers resolve real paths, so those tests build a throwaway
// mini-repo on disk rather than passing inline source strings — resolution
// through tsconfig `paths` and a package's `exports["."]` is exactly what this
// guard exists to model, and stubbing it would test nothing.
//
// Run with `node --test scripts/check-client-graph.test.mjs`.
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import assert from 'node:assert/strict';
import { after, describe, it } from 'node:test';

import {
  buildAliasMap,
  collectClientEntrypoints,
  extractRuntimeSpecifiers,
  findLeaksFrom,
  listSourceRoots,
  listWorkspaces,
  parseSource,
  readDirectives,
  resolveSpecifier,
} from './check-client-graph.mjs';

const parse = (text) => parseSource('/virtual/module.tsx', text);

describe('readDirectives', () => {
  it('reads a leading directive prologue', () => {
    assert.equal(
      readDirectives(parse("'use client';\nexport const a = 1;")).has(
        'use client',
      ),
      true,
    );
  });

  it('reads every directive in the prologue', () => {
    const directives = readDirectives(
      parse("'use strict';\n'use server';\nexport const a = 1;"),
    );
    assert.equal(directives.has('use server'), true);
  });

  it('ignores a string expression that is not part of the prologue', () => {
    const directives = readDirectives(
      parse("export const a = 1;\n'use client';"),
    );
    assert.equal(directives.has('use client'), false);
  });

  it('returns an empty set for a module with no directives', () => {
    assert.deepEqual(readDirectives(parse('export const a = 1;')), new Set());
  });
});

describe('extractRuntimeSpecifiers', () => {
  it('keeps a value import', () => {
    assert.deepEqual(
      extractRuntimeSpecifiers(parse("import { a } from './a';")),
      ['./a'],
    );
  });

  it('keeps a bare side-effect import, which is how server-only is written', () => {
    assert.deepEqual(extractRuntimeSpecifiers(parse("import 'server-only';")), [
      'server-only',
    ]);
  });

  it('keeps a default import', () => {
    assert.deepEqual(extractRuntimeSpecifiers(parse("import a from './a';")), [
      './a',
    ]);
  });

  it('keeps a re-export, which pulls the module into the graph', () => {
    assert.deepEqual(
      extractRuntimeSpecifiers(parse("export { a } from './a';")),
      ['./a'],
    );
  });

  it('keeps a star re-export', () => {
    assert.deepEqual(extractRuntimeSpecifiers(parse("export * from './a';")), [
      './a',
    ]);
  });

  it('keeps a dynamic import, which still becomes a client chunk', () => {
    assert.deepEqual(
      extractRuntimeSpecifiers(parse("const a = await import('./a');")),
      ['./a'],
    );
  });

  it('drops a type-only import, which is erased before bundling', () => {
    assert.deepEqual(
      extractRuntimeSpecifiers(parse("import type { A } from './a';")),
      [],
    );
  });

  it('drops a named import whose every specifier is inline type-only', () => {
    assert.deepEqual(
      extractRuntimeSpecifiers(parse("import { type A, type B } from './a';")),
      [],
    );
  });

  it('keeps a named import that mixes an inline type with a value', () => {
    assert.deepEqual(
      extractRuntimeSpecifiers(parse("import { type A, b } from './a';")),
      ['./a'],
    );
  });

  it('keeps a default import paired with an inline type specifier', () => {
    assert.deepEqual(
      extractRuntimeSpecifiers(parse("import a, { type B } from './a';")),
      ['./a'],
    );
  });

  it('keeps an import-equals require, which is a runtime edge', () => {
    assert.deepEqual(
      extractRuntimeSpecifiers(parse("import a = require('./a');")),
      ['./a'],
    );
  });

  it('drops a dynamic import whose specifier is computed rather than literal', () => {
    assert.deepEqual(
      extractRuntimeSpecifiers(
        parse('const a = await import(`./messages/${locale}.json`);'),
      ),
      [],
    );
  });

  it('drops a type-only re-export', () => {
    assert.deepEqual(
      extractRuntimeSpecifiers(parse("export type { A } from './a';")),
      [],
    );
  });
});

// A throwaway mini-repo: one app aliased as `@app/*`, one package that mixes a
// server-only transport with a client-safe helper behind its own alias and
// `exports["."]` barrel — the shape this guard exists to police.
const createFixtureRepo = () => {
  const root = mkdtempSync(join(tmpdir(), 'client-graph-'));

  const write = (relativePath, contents) => {
    const file = join(root, relativePath);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, contents);
    return file;
  };

  write(
    'apps/app/tsconfig.json',
    `{
      // A comment, because the real tsconfigs carry them and the parser must
      // tolerate JSONC.
      "compilerOptions": {
        "paths": {
          "@app/*": ["./src/*"],
          "@blog/mail/*": ["../../packages/mail/src/*"]
        }
      }
    }`,
  );

  write(
    'packages/mail/package.json',
    JSON.stringify({
      name: '@blog/mail',
      exports: { '.': './src/index.ts', './html': './src/html/index.ts' },
    }),
  );
  write(
    'packages/mail/src/index.ts',
    "export * from './transport/send';\nexport * from './html';\n",
  );
  write(
    'packages/mail/src/transport/send.ts',
    "import 'server-only';\nexport const send = () => null;\n",
  );
  write(
    'packages/mail/src/html/index.ts',
    'export const shell = () => null;\n',
  );

  return { root, write };
};

describe('buildAliasMap', () => {
  const { root } = createFixtureRepo();
  after(() => rmSync(root, { recursive: true, force: true }));

  const aliases = buildAliasMap(root, ['apps/app']);

  it('reads wildcard aliases out of a tsconfig containing comments', () => {
    assert.equal(aliases.get('@app'), join(root, 'apps/app/src'));
  });

  it('resolves a target relative to the tsconfig that declares it', () => {
    assert.equal(aliases.get('@blog/mail'), join(root, 'packages/mail/src'));
  });
});

describe('resolveSpecifier', () => {
  const { root, write } = createFixtureRepo();
  const importer = write('apps/app/src/thing.ts', 'export const thing = 1;\n');
  const aliases = buildAliasMap(root, ['apps/app']);
  const resolve = (specifier) =>
    resolveSpecifier(specifier, importer, { aliases, root });
  after(() => rmSync(root, { recursive: true, force: true }));

  it('flags the server-only marker itself', () => {
    assert.equal(resolve('server-only').kind, 'taint');
  });

  it('resolves an aliased deep import the package never declared', () => {
    const resolved = resolve('@blog/mail/transport/send');
    assert.equal(resolved.kind, 'internal');
    assert.equal(
      resolved.file,
      join(root, 'packages/mail/src/transport/send.ts'),
    );
  });

  it('resolves a bare package specifier through its exports barrel', () => {
    const resolved = resolve('@blog/mail');
    assert.equal(resolved.kind, 'internal');
    assert.equal(resolved.file, join(root, 'packages/mail/src/index.ts'));
  });

  it('treats an unrelated npm package as external', () => {
    assert.equal(resolve('react').kind, 'external');
  });
});

describe('findLeaksFrom', () => {
  const { root, write } = createFixtureRepo();
  const aliases = buildAliasMap(root, ['apps/app']);
  const leaksFrom = (file) => findLeaksFrom(file, { aliases, root });
  after(() => rmSync(root, { recursive: true, force: true }));

  it('reports the chain when a client module deep-imports an undeclared server-only path', () => {
    const entry = write(
      'apps/app/src/deep.tsx',
      "'use client';\nimport { send } from '@blog/mail/transport/send';\nexport const C = () => send();\n",
    );
    const leaks = leaksFrom(entry);
    assert.equal(leaks.length, 1);
    assert.deepEqual(leaks[0], [
      entry,
      join(root, 'packages/mail/src/transport/send.ts'),
    ]);
  });

  it('reports the chain when a client module imports the barrel', () => {
    const entry = write(
      'apps/app/src/barrel.tsx',
      "'use client';\nimport { send } from '@blog/mail';\nexport const C = () => send();\n",
    );
    const leaks = leaksFrom(entry);
    assert.equal(leaks.length, 1);
    assert.deepEqual(leaks[0], [
      entry,
      join(root, 'packages/mail/src/index.ts'),
      join(root, 'packages/mail/src/transport/send.ts'),
    ]);
  });

  it('finds a leak several relative hops deep', () => {
    write('apps/app/src/mid/index.ts', "export * from '../leafy';\n");
    write(
      'apps/app/src/leafy.ts',
      "import { send } from '@blog/mail/transport/send';\nexport const go = () => send();\n",
    );
    const entry = write(
      'apps/app/src/nested.tsx',
      "'use client';\nimport { go } from '@app/mid';\nexport const C = () => go();\n",
    );
    assert.equal(leaksFrom(entry).length, 1);
  });

  it('accepts a client module importing the client-safe entrypoint', () => {
    const entry = write(
      'apps/app/src/safe.tsx',
      "'use client';\nimport { shell } from '@blog/mail/html';\nexport const C = () => shell();\n",
    );
    assert.deepEqual(leaksFrom(entry), []);
  });

  it('stops at a "use server" module, which Next replaces with a network reference', () => {
    write(
      'apps/app/src/actions.ts',
      "'use server';\nimport { send } from '@blog/mail';\nexport const act = async () => send();\n",
    );
    const entry = write(
      'apps/app/src/with-action.tsx',
      "'use client';\nimport { act } from '@app/actions';\nexport const C = () => act();\n",
    );
    assert.deepEqual(leaksFrom(entry), []);
  });

  it('accepts a type-only import of a server-only module', () => {
    const entry = write(
      'apps/app/src/typed.tsx',
      "'use client';\nimport type { Send } from '@blog/mail';\nexport const C = (_: Send) => null;\n",
    );
    assert.deepEqual(leaksFrom(entry), []);
  });

  it('treats a non-TypeScript side-effect import as an opaque leaf', () => {
    write('apps/app/src/styles.css', '.a { color: red }\n');
    const entry = write(
      'apps/app/src/styled.tsx',
      "'use client';\nimport './styles.css';\nexport const C = () => null;\n",
    );
    assert.deepEqual(leaksFrom(entry), []);
  });

  it('terminates on a circular import graph', () => {
    write('apps/app/src/ping.ts', "export * from './pong';\n");
    write(
      'apps/app/src/pong.ts',
      "export * from './ping';\nexport const p = 1;\n",
    );
    const entry = write(
      'apps/app/src/cycle.tsx',
      "'use client';\nimport { p } from '@app/ping';\nexport const C = () => p;\n",
    );
    assert.deepEqual(leaksFrom(entry), []);
  });
});

describe('listWorkspaces', () => {
  const { root } = createFixtureRepo();
  after(() => rmSync(root, { recursive: true, force: true }));

  it('discovers every workspace carrying a tsconfig, so a new one needs no list edit', () => {
    assert.deepEqual(listWorkspaces(root), [join('apps', 'app')]);
  });
});

describe('listSourceRoots', () => {
  const { root, write } = createFixtureRepo();
  write('apps/app/src/page.tsx', 'export const P = () => null;\n');
  after(() => rmSync(root, { recursive: true, force: true }));

  it('finds every app and package src directory, so a client module in a package is covered too', () => {
    assert.deepEqual(listSourceRoots(root).sort(), [
      join('apps', 'app', 'src'),
      join('packages', 'mail', 'src'),
    ]);
  });
});

describe('collectClientEntrypoints', () => {
  const { root, write } = createFixtureRepo();
  after(() => rmSync(root, { recursive: true, force: true }));

  it("collects only modules carrying the 'use client' directive", () => {
    const client = write(
      'apps/app/src/a.tsx',
      "'use client';\nexport const A = () => null;\n",
    );
    write('apps/app/src/b.tsx', 'export const B = () => null;\n');
    assert.deepEqual(collectClientEntrypoints(root, ['apps/app/src']), [
      client,
    ]);
  });

  it('skips co-located test files', () => {
    write(
      'apps/app/src/c.test.tsx',
      "'use client';\nexport const C = () => null;\n",
    );
    assert.deepEqual(
      collectClientEntrypoints(root, ['apps/app/src']).filter((f) =>
        f.includes('.test.'),
      ),
      [],
    );
  });
});
