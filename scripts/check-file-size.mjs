// Holds CLAUDE.md's file size budgets as a ratchet: a file over budget must be
// in the baseline at its exact non-blank line count, so it can only shrink.
// `--update` lowers or removes baseline entries and never raises or adds one.
import {
  existsSync,
  readdirSync,
  readFileSync,
  realpathSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { basename, dirname, isAbsolute, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

const BASELINE_PATH = 'scripts/file-size-baseline.json';
const UPDATE_FLAG = '--update';
const SCAN_ROOTS = ['apps/*/src', 'packages/*/src', 'packages/db/scripts'];

export const BUDGET = { COMPONENT: 150, HOOK: 120, MODULE: 120 };

const KIND = { COMPONENT: 'component', HOOK: 'hook', MODULE: 'module' };

const REGISTRIES = new Set(['icon-registry.ts']);

const EXEMPT_PATTERNS = [
  /-variants\.ts$/,
  /\.(test|spec|stories)\.tsx?$/,
  /(^|\/)sanity\/generated\//,
  /^packages\/studio\/src\/schema-types\/(documents|objects|modules)\//,
];

const SOURCE_PATTERN = /\.tsx?$/;

const toPosix = (file) => file.split(sep).join('/');

const isInScope = (file) =>
  SOURCE_PATTERN.test(file) &&
  (/^(apps|packages)\/[^/]+\/src\//.test(file) ||
    file.startsWith('packages/db/scripts/'));

const isExempt = (file) =>
  REGISTRIES.has(basename(file)) ||
  EXEMPT_PATTERNS.some((pattern) => pattern.test(file));

const classify = (file) => {
  if (file.endsWith('.tsx'))
    return { kind: KIND.COMPONENT, budget: BUDGET.COMPONENT };
  if (basename(file).startsWith('use-'))
    return { kind: KIND.HOOK, budget: BUDGET.HOOK };
  return { kind: KIND.MODULE, budget: BUDGET.MODULE };
};

export const countNonBlankLines = (text) =>
  text.split('\n').filter((line) => line.trim() !== '').length;

export const measure = (files, readText) =>
  files
    .filter((file) => isInScope(file) && !isExempt(file))
    .map((file) => ({
      file,
      lines: countNonBlankLines(readText(file)),
      ...classify(file),
    }));

export const findProblems = (measured, baseline, { checkMissing }) => {
  const problems = [];
  const seen = new Set();
  for (const { file, lines, kind, budget } of measured) {
    seen.add(file);
    const recorded = baseline[file];
    if (recorded === undefined) {
      if (lines > budget)
        problems.push(
          `${file} has ${lines} non-blank lines; the ${kind} budget is ${budget}. Extract the part you changed.`,
        );
    } else if (lines > recorded) {
      problems.push(
        `${file} grew to ${lines} non-blank lines from its baseline of ${recorded}; the ${kind} budget is ${budget}. Extract the part you changed instead of adding to it.`,
      );
    } else if (lines < recorded) {
      problems.push(
        `${file} shrank to ${lines} non-blank lines from its baseline of ${recorded}; run \`pnpm check:file-size --update\` to lower its entry.`,
      );
    }
  }
  if (checkMissing) {
    for (const file of Object.keys(baseline)) {
      if (!seen.has(file))
        problems.push(
          `${file} is in ${BASELINE_PATH} but is gone or no longer budgeted; run \`pnpm check:file-size --update\` to remove its entry.`,
        );
    }
  }
  return problems;
};

export const ratchetBaseline = (measured, baseline, { checkMissing }) => {
  const byFile = new Map(measured.map((entry) => [entry.file, entry]));
  const next = {};
  for (const [file, recorded] of Object.entries(baseline)) {
    const entry = byFile.get(file);
    if (!entry) {
      if (!checkMissing) next[file] = recorded;
      continue;
    }
    if (entry.lines > entry.budget)
      next[file] = Math.min(recorded, entry.lines);
  }
  return Object.fromEntries(
    Object.entries(next).sort(([a], [b]) => a.localeCompare(b)),
  );
};

const globRoot = (pattern) => {
  const [top, wildcard, rest] = pattern.split('/');
  if (wildcard !== '*') return [pattern];
  const topDir = join(repoRoot, top);
  if (!existsSync(topDir)) return [];
  return readdirSync(topDir).map((name) => `${top}/${name}/${rest}`);
};

const walk = (dir) =>
  readdirSync(join(repoRoot, dir), { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === 'node_modules') return [];
    const path = `${dir}/${entry.name}`;
    return entry.isDirectory() ? walk(path) : [path];
  });

const listAllFiles = () =>
  SCAN_ROOTS.flatMap(globRoot)
    .filter(
      (dir) =>
        existsSync(join(repoRoot, dir)) &&
        statSync(join(repoRoot, dir)).isDirectory(),
    )
    .flatMap(walk);

const toRepoPath = (arg) =>
  toPosix(isAbsolute(arg) ? relative(repoRoot, arg) : arg);

const readBaseline = () =>
  JSON.parse(readFileSync(join(repoRoot, BASELINE_PATH), 'utf8'));

const main = () => {
  const args = process.argv.slice(2);
  const update = args.includes(UPDATE_FLAG);
  const named = args.filter((arg) => arg !== UPDATE_FLAG).map(toRepoPath);
  const checkMissing = named.length === 0;
  const files = (checkMissing ? listAllFiles() : named).filter((file) =>
    existsSync(join(repoRoot, file)),
  );
  const measured = measure(files, (file) =>
    readFileSync(join(repoRoot, file), 'utf8'),
  );
  const baseline = update
    ? ratchetBaseline(measured, readBaseline(), { checkMissing })
    : readBaseline();

  if (update) {
    writeFileSync(
      join(repoRoot, BASELINE_PATH),
      `${JSON.stringify(baseline, null, 2)}\n`,
    );
    console.log(
      `File size: ${BASELINE_PATH} holds ${Object.keys(baseline).length} entries.`,
    );
  }

  const problems = findProblems(measured, baseline, { checkMissing });
  if (problems.length === 0) {
    console.log(
      `File size: ${measured.length} files within budget or baseline.`,
    );
    return;
  }
  for (const problem of problems) console.error(`error: ${problem}`);
  process.exitCode = 1;
};

if (
  process.argv[1] &&
  realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)
)
  main();
