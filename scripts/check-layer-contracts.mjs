// Fails when a workspace's `@blog/*` runtime dependencies in its package.json
// disagree with the `Imports` column of SPEC.md §4's layer table, or when the
// CLAUDE.md layer-contract diagram disagrees with that table. A dependency the
// table lists inside a `(+ … scoped)` note is a documented scoped exception:
// package.json must carry it, and the diagram must not.
//
// Run with `pnpm check:layer-contracts`. Read-only; exits 1 on any mismatch.
import { readdirSync, readFileSync, realpathSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(scriptDir, '..');

const SPEC_FILE = join(repoRoot, 'SPEC.md');
const CLAUDE_FILE = join(repoRoot, 'CLAUDE.md');
const WORKSPACE_DIRS = ['apps', 'packages'];
const SPEC_SECTION_HEADING = '## 4. ';
const CLAUDE_SECTION_HEADING = '## Layer contracts';
const SCOPE = '@blog/';

export const readWorkspaces = (root = repoRoot) =>
  WORKSPACE_DIRS.flatMap((dir) =>
    readdirSync(join(root, dir), { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
      .map((entry) => ({
        name: entry.name,
        pkg: JSON.parse(
          readFileSync(join(root, dir, entry.name, 'package.json'), 'utf8'),
        ),
      })),
  );

const isConfigPackage = (dep) => dep.endsWith('-config');

export const blogDependencies = (pkg) =>
  Object.keys(pkg.dependencies ?? {})
    .filter((dep) => dep.startsWith(SCOPE) && !isConfigPackage(dep))
    .map((dep) => dep.slice(SCOPE.length))
    .sort();

const sectionLines = (text, heading) => {
  const lines = text.split('\n');
  const start = lines.findIndex((line) => line.startsWith(heading));
  if (start === -1) throw new Error(`Heading "${heading}" not found`);
  const end = lines.findIndex((line, i) => i > start && /^## /.test(line));
  return lines.slice(start + 1, end === -1 ? undefined : end);
};

const toWorkspaceName = (token, names) => {
  const bare = token.startsWith(SCOPE) ? token.slice(SCOPE.length) : token;
  return names.has(bare) ? bare : undefined;
};

const parseImportsCell = (cell, names) => {
  const scopedNote = cell.match(/\(\+([^)]*)\)/);
  const plain = cell.replace(/\(\+[^)]*\)/, '').replace(/\([^)]*\)/g, '');
  const imports = plain
    .split(',')
    .map((item) => item.replaceAll('`', '').trim().split(/\s+/)[0])
    .map((token) => toWorkspaceName(token, names))
    .filter(Boolean);
  const scoped = [...(scopedNote?.[1].matchAll(/`([^`]+)`/g) ?? [])]
    .map(([, token]) => toWorkspaceName(token, names))
    .filter(Boolean);
  return { imports: imports.sort(), scoped: scoped.sort() };
};

export const parseSpecTable = (specText, names) => {
  const rows = new Map();
  for (const line of sectionLines(specText, SPEC_SECTION_HEADING)) {
    const cells = line.split('|').map((cell) => cell.trim());
    const layer = cells[1]?.match(/^`([^`]+)`/)?.[1];
    if (!layer) continue;
    const name = toWorkspaceName(layer, names);
    if (name) rows.set(name, parseImportsCell(cells[2], names));
  }
  return rows;
};

export const parseClaudeDiagram = (claudeText, names) => {
  const lines = sectionLines(claudeText, CLAUDE_SECTION_HEADING);
  const open = lines.findIndex((line) => line.startsWith('```'));
  const close = lines.findIndex(
    (line, i) => i > open && line.startsWith('```'),
  );
  const rows = new Map();
  for (const line of lines.slice(open + 1, close)) {
    for (const [, layer, targets] of line.matchAll(
      /(\S+) → (.*?)(?=\s{2,}\S+ →|$)/g,
    )) {
      if (!names.has(layer)) continue;
      const list = targets
        .replace(/\(.*$/, '')
        .split(',')
        .map((token) => toWorkspaceName(token.trim(), names))
        .filter(Boolean);
      rows.set(layer, list.sort());
    }
  }
  return rows;
};

export const diagramLine = (name, imports) =>
  `${name} → ${imports.length ? imports.join(', ') : 'nothing'}`;

const sameList = (a, b) => a.join() === b.join();

const describe = (label, expected, actual, source) => {
  const missing = expected.filter((dep) => !actual.includes(dep));
  const extra = actual.filter((dep) => !expected.includes(dep));
  return [
    ...missing.map((dep) => `${label} is missing ${dep}`),
    ...extra.map((dep) => `${label} lists ${dep}, which ${source} does not`),
  ];
};

export const findMismatches = ({ workspaces, specRows, diagramRows }) => {
  const problems = [];
  for (const { name, pkg } of workspaces) {
    const deps = blogDependencies(pkg);
    const row = specRows.get(name);
    if (!row) {
      problems.push(`${name}: no row in the SPEC.md §4 table`);
      continue;
    }
    const tableDeps = [...row.imports, ...row.scoped].sort();
    if (!sameList(deps, tableDeps))
      problems.push(
        ...describe(
          `${name}: SPEC.md §4 table`,
          deps,
          tableDeps,
          'package.json',
        ),
      );
    const diagram = diagramRows.get(name);
    if (!diagram) {
      problems.push(
        `${name}: no line in the CLAUDE.md layer diagram; expected "${diagramLine(name, row.imports)}"`,
      );
      continue;
    }
    if (!sameList(row.imports, diagram))
      problems.push(
        ...describe(
          `${name}: CLAUDE.md diagram`,
          row.imports,
          diagram,
          'the SPEC.md §4 table',
        ),
      );
  }
  return problems;
};

const main = () => {
  const workspaces = readWorkspaces();
  const names = new Set(workspaces.map(({ name }) => name));
  const problems = findMismatches({
    workspaces,
    specRows: parseSpecTable(readFileSync(SPEC_FILE, 'utf8'), names),
    diagramRows: parseClaudeDiagram(readFileSync(CLAUDE_FILE, 'utf8'), names),
  });

  if (problems.length) {
    console.error(
      [
        'Layer-contract docs disagree with the real dependency graph:',
        ...problems.map((problem) => `  ${problem}`),
        '',
        "Fix the SPEC.md §4 table's Imports column and the CLAUDE.md diagram to match each package.json's @blog/* dependencies.",
      ].join('\n'),
    );
    process.exit(1);
  }

  console.log(
    'SPEC.md §4 and the CLAUDE.md layer diagram match every workspace package.json.',
  );
};

if (
  process.argv[1] &&
  realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main();
}
