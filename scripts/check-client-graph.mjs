// Checks that no `'use client'` module anywhere in the repo can transitively
// reach a module that imports `server-only`. That import is the marker Next.js uses to
// fail a build when server-only code lands in the client graph, so this check
// is a local, fast stand-in for the one thing that catches the mistake today: a
// red `Build` job on an already-open PR.
//
// The gap this closes is that `exports` maps are not a resolution boundary in
// this repo. Every workspace aliases `@blog/<pkg>/*` straight to
// `packages/<pkg>/src/*` via tsconfig `paths`, so a deep import resolves
// whether or not the package declares it — and `type-check`, `lint`, `test` and
// `knip` all stay green either way.
//
// Nothing here is specific to one package: the taint marker is `server-only`
// itself, so `@blog/db`, `@blog/auth`, `@blog/service` and `@blog/email` are all
// covered, as is any future package that mixes a server-only transport with
// client-safe helpers.
//
// Two things the walk must get right, or it reports nonsense:
//
//   - `'use server'` files are a boundary, not a module the client bundle
//     pulls in — Next replaces a Server Action import with a network
//     reference. Almost every Server Action reaches the database, so walking
//     through them flags nearly all of them.
//   - Type-only imports are erased before the bundler sees them, so
//     `import type { TUser } from '@blog/db'` is not a client-graph edge.
//
// Aliases are read from each workspace's own tsconfig `paths` rather than
// hardcoded, so the guard follows the same resolution the failure class abuses.
//
// Run with `pnpm check:client-graph`. Read-only; exits 1 on any leak.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(scriptDir, '..');

const TAINT_SPECIFIER = 'server-only';
const CLIENT_DIRECTIVE = 'use client';
const SERVER_DIRECTIVE = 'use server';

// Every `'use client'` module in the repo is an entrypoint, not just the two
// apps': `@blog/studio`'s mount component carries the directive too, and a
// package's client module can reach server-only code exactly as easily.
const SOURCE_ROOT_PARENTS = ['apps', 'packages'];

const RESOLVABLE_EXTENSIONS = ['.ts', '.tsx'];

const parsedModules = new Map();

// Widely-shared modules (`@blog/config`, `@blog/ui`) sit in most entrypoints'
// graphs, so parsing per entrypoint re-reads the same files ~79 times. Keyed by
// absolute path and never invalidated: rewriting a file at a path already read
// in this process yields the stale AST, which tests must avoid by giving each
// fixture repo its own root.
const readModule = (file) => {
  const cached = parsedModules.get(file);
  if (cached !== undefined) {
    return cached;
  }
  const sf = parseSource(file, readFileSync(file, 'utf8'));
  parsedModules.set(file, sf);
  return sf;
};

export const parseSource = (file, text) =>
  ts.createSourceFile(
    file,
    text,
    ts.ScriptTarget.Latest,
    /* setParentNodes */ true,
    ts.ScriptKind.TSX,
  );

// The leading string-literal directives (`'use client'`, `'use server'`) a
// module opens with. Only a prologue counts — a bare string expression further
// down the file is not a directive.
export const readDirectives = (sf) => {
  const directives = new Set();
  for (const statement of sf.statements) {
    if (
      !ts.isExpressionStatement(statement) ||
      !ts.isStringLiteral(statement.expression)
    ) {
      break;
    }
    directives.add(statement.expression.text);
  }
  return directives;
};

const isErasedImportClause = (clause) => {
  if (clause === undefined) {
    return false;
  }
  if (clause.isTypeOnly) {
    return true;
  }
  const bindings = clause.namedBindings;
  if (
    clause.name === undefined &&
    bindings !== undefined &&
    ts.isNamedImports(bindings)
  ) {
    return (
      bindings.elements.length > 0 &&
      bindings.elements.every((element) => element.isTypeOnly)
    );
  }
  return false;
};

const isErasedExportClause = (declaration) => {
  if (declaration.isTypeOnly) {
    return true;
  }
  const clause = declaration.exportClause;
  if (clause !== undefined && ts.isNamedExports(clause)) {
    return (
      clause.elements.length > 0 &&
      clause.elements.every((element) => element.isTypeOnly)
    );
  }
  return false;
};

// Every module specifier that survives to runtime: static imports and
// re-exports that are not type-only, bare side-effect imports (which is how
// `server-only` itself is written), `import x = require()`, and dynamic
// `import()` calls written with a literal specifier — a computed one cannot be
// followed statically.
export const extractRuntimeSpecifiers = (sf) => {
  const specifiers = [];

  const visit = (node) => {
    if (
      ts.isImportDeclaration(node) &&
      ts.isStringLiteral(node.moduleSpecifier) &&
      !isErasedImportClause(node.importClause)
    ) {
      specifiers.push(node.moduleSpecifier.text);
    }

    if (
      ts.isExportDeclaration(node) &&
      node.moduleSpecifier !== undefined &&
      ts.isStringLiteral(node.moduleSpecifier) &&
      !isErasedExportClause(node)
    ) {
      specifiers.push(node.moduleSpecifier.text);
    }

    if (
      ts.isImportEqualsDeclaration(node) &&
      ts.isExternalModuleReference(node.moduleReference) &&
      ts.isStringLiteral(node.moduleReference.expression)
    ) {
      specifiers.push(node.moduleReference.expression.text);
    }

    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments[0] !== undefined &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      specifiers.push(node.arguments[0].text);
    }

    ts.forEachChild(node, visit);
  };

  visit(sf);
  return specifiers;
};

// `@web/*` → `apps/web/src/*`, `@blog/db/*` → `packages/db/src/*`, … read from
// the tsconfig `paths` that actually drive resolution. Targets are resolved
// against the declaring tsconfig's own directory, so a package's self-alias
// (`"@blog/email/*": ["./src/*"]`) lands in the right place.
export const listWorkspaces = (root = repoRoot) =>
  SOURCE_ROOT_PARENTS.flatMap((parent) => {
    const parentDir = join(root, parent);
    if (!existsSync(parentDir)) {
      return [];
    }
    return readdirSync(parentDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => join(parent, entry.name))
      .filter((workspace) =>
        existsSync(join(root, workspace, 'tsconfig.json')),
      );
  });

export const buildAliasMap = (
  root = repoRoot,
  sources = listWorkspaces(root),
) => {
  const aliases = new Map();

  for (const workspace of sources) {
    const configFile = join(root, workspace, 'tsconfig.json');
    if (!existsSync(configFile)) {
      continue;
    }
    const { config } = ts.parseConfigFileTextToJson(
      configFile,
      readFileSync(configFile, 'utf8'),
    );
    const paths = config?.compilerOptions?.paths ?? {};

    for (const [pattern, targets] of Object.entries(paths)) {
      const target = targets?.[0];
      if (
        target === undefined ||
        !pattern.endsWith('/*') ||
        !target.endsWith('/*')
      ) {
        continue;
      }
      const prefix = pattern.slice(0, -2);
      const resolved = resolve(root, workspace, target.slice(0, -2));
      if (!aliases.has(prefix)) {
        aliases.set(prefix, resolved);
      }
    }
  }

  return aliases;
};

const isParseable = (file) =>
  RESOLVABLE_EXTENSIONS.some((extension) => file.endsWith(extension));

const tryFile = (base) => {
  const candidates = [
    ...(isParseable(base) ? [base] : []),
    ...RESOLVABLE_EXTENSIONS.map((extension) => `${base}${extension}`),
    ...RESOLVABLE_EXTENSIONS.map((extension) =>
      join(base, `index${extension}`),
    ),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate) && statSync(candidate).isFile()) {
      return candidate;
    }
  }
  return null;
};

// A bare `@blog/<pkg>` has no tsconfig alias — it resolves through the
// package's own `exports["."]`, which is the barrel that dragged server-only
// code into the client graph in the first place.
const resolvePackageRoot = (specifier, root) => {
  const match = /^@blog\/([a-z0-9-]+)$/.exec(specifier);
  if (match === null) {
    return null;
  }
  const packageDir = join(root, 'packages', match[1]);
  const manifestFile = join(packageDir, 'package.json');
  if (!existsSync(manifestFile)) {
    return null;
  }
  const manifest = JSON.parse(readFileSync(manifestFile, 'utf8'));
  const entry = manifest.exports?.['.'];
  return typeof entry === 'string' ? tryFile(resolve(packageDir, entry)) : null;
};

export const resolveSpecifier = (
  specifier,
  fromFile,
  { aliases, root = repoRoot } = {},
) => {
  if (specifier === TAINT_SPECIFIER) {
    return { kind: 'taint' };
  }

  if (specifier.startsWith('.')) {
    const file = tryFile(resolve(dirname(fromFile), specifier));
    return file === null ? { kind: 'unresolved' } : { kind: 'internal', file };
  }

  for (const [prefix, target] of aliases) {
    if (specifier.startsWith(`${prefix}/`)) {
      const file = tryFile(resolve(target, specifier.slice(prefix.length + 1)));
      return file === null
        ? { kind: 'unresolved' }
        : { kind: 'internal', file };
    }
  }

  const packageEntry = resolvePackageRoot(specifier, root);
  if (packageEntry !== null) {
    return { kind: 'internal', file: packageEntry };
  }

  return { kind: 'external' };
};

const listSourceFiles = (dir, acc = []) => {
  if (!existsSync(dir)) {
    return acc;
  }
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) {
      continue;
    }
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      listSourceFiles(path, acc);
    } else if (
      /\.tsx?$/.test(entry.name) &&
      !/\.(test|stories)\.tsx?$/.test(entry.name)
    ) {
      acc.push(path);
    }
  }
  return acc;
};

export const listSourceRoots = (root = repoRoot) =>
  SOURCE_ROOT_PARENTS.flatMap((parent) => {
    const parentDir = join(root, parent);
    if (!existsSync(parentDir)) {
      return [];
    }
    return readdirSync(parentDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => join(parent, entry.name, 'src'))
      .filter((sourceRoot) => existsSync(join(root, sourceRoot)));
  });

export const collectClientEntrypoints = (
  root = repoRoot,
  sourceRoots = listSourceRoots(root),
) => {
  const entrypoints = [];
  for (const sourceRoot of sourceRoots) {
    for (const file of listSourceFiles(join(root, sourceRoot))) {
      if (readDirectives(readModule(file)).has(CLIENT_DIRECTIVE)) {
        entrypoints.push(file);
      }
    }
  }
  return entrypoints.sort();
};

// Walks one client entrypoint's runtime import graph and returns the import
// chain to every module that reaches `server-only`. Stops at `'use server'`
// modules, which are a network boundary rather than a client-graph edge.
export const findLeaksFrom = (entryFile, { aliases, root = repoRoot } = {}) => {
  const leaks = [];
  const visited = new Set();
  const queue = [[entryFile, [entryFile]]];

  while (queue.length > 0) {
    const [file, chain] = queue.pop();
    if (visited.has(file)) {
      continue;
    }
    visited.add(file);

    for (const specifier of extractRuntimeSpecifiers(readModule(file))) {
      const resolved = resolveSpecifier(specifier, file, { aliases, root });

      if (resolved.kind === 'taint') {
        leaks.push(chain);
        continue;
      }
      if (resolved.kind !== 'internal' || visited.has(resolved.file)) {
        continue;
      }

      if (readDirectives(readModule(resolved.file)).has(SERVER_DIRECTIVE)) {
        continue;
      }

      queue.push([resolved.file, [...chain, resolved.file]]);
    }
  }

  return leaks;
};

const main = () => {
  const aliases = buildAliasMap();
  const entrypoints = collectClientEntrypoints();

  if (entrypoints.length === 0) {
    console.error(
      "No 'use client' modules found — the guard would pass vacuously. Check SOURCE_ROOT_PARENTS.",
    );
    process.exit(1);
  }

  const failures = [];
  for (const entry of entrypoints) {
    for (const chain of findLeaksFrom(entry, { aliases })) {
      failures.push(chain.map((file) => relative(repoRoot, file)));
    }
  }

  if (failures.length > 0) {
    console.error(
      `server-only code is reachable from the client graph (${failures.length} import chain(s)):\n`,
    );
    for (const chain of failures) {
      console.error(
        `  ${chain.join('\n    -> ')}\n    -> ${TAINT_SPECIFIER}\n`,
      );
    }
    console.error(
      'Import the package\'s client-safe entrypoint instead, or move the call behind a "use server" module.',
    );
    process.exit(1);
  }

  console.log(
    `No server-only code reachable from ${entrypoints.length} client entrypoint(s).`,
  );
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
