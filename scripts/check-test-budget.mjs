// Reads each workspace's vitest JSON report and names every test file whose
// tests ran longer than its budget. Warns and exits 0 by default, because
// local and cloud-session timings vary too much to gate on; `--enforce`
// (CI's Test job) exits 1 instead.
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, realpathSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

const DEFAULT_BUDGET_SECONDS = 15;
const ALLOWLIST_PATH = 'scripts/test-budget-allowlist.json';
const REPORT_PATH = '.vitest/timings.json';
const WORKSPACE_ROOTS = ['apps', 'packages'];
const BASE_REF = 'origin/main';
const BASE_REF_VAR = 'TEST_BUDGET_BASE_REF';
const ENFORCE_FLAG = '--enforce';
const MS_PER_SECOND = 1000;

export const readFileTimings = (reportText, root) =>
  JSON.parse(reportText).testResults.map(({ name, startTime, endTime }) => ({
    file: relative(root, name),
    seconds: (endTime - startTime) / MS_PER_SECOND,
  }));

export const findOverBudget = (timings, allowlist, defaultBudget) =>
  timings
    .map(({ file, seconds }) => ({
      file,
      seconds,
      budget: allowlist[file] ?? defaultBudget,
    }))
    .filter(({ seconds, budget }) => seconds > budget)
    .sort((a, b) => b.seconds - a.seconds);

export const findAllowlistGrowth = (baseAllowlist, headAllowlist) =>
  Object.entries(headAllowlist)
    .filter(
      ([file, budget]) =>
        baseAllowlist[file] === undefined || budget > baseAllowlist[file],
    )
    .map(([file, budget]) => ({
      file,
      budget,
      baseBudget: baseAllowlist[file],
    }));

export const findMissingEntries = (allowlist, exists) =>
  Object.keys(allowlist).filter((file) => !exists(file));

const formatSeconds = (seconds) => `${seconds.toFixed(1)}s`;

export const formatOverBudget = ({ file, seconds, budget }) =>
  `${file} took ${formatSeconds(seconds)}, budget ${budget}s`;

const formatGrowth = ({ file, budget, baseBudget }, baseRef) =>
  baseBudget === undefined
    ? `${file} was added to ${ALLOWLIST_PATH} with ${budget}s; it is not on ${baseRef}, and the allowlist may only shrink`
    : `${file} raises its ${ALLOWLIST_PATH} budget from ${baseBudget}s on ${baseRef} to ${budget}s; the allowlist may only shrink`;

const formatMissing = (file) =>
  `${file} is in ${ALLOWLIST_PATH} but no longer exists; remove its entry`;

const formatPass = (fileCount, allowlistCount) =>
  `Test budget: ${fileCount} test files within budget (${DEFAULT_BUDGET_SECONDS}s, ${allowlistCount} allowlisted).`;

const readReports = () =>
  WORKSPACE_ROOTS.flatMap((dir) =>
    existsSync(join(repoRoot, dir))
      ? readdirSync(join(repoRoot, dir)).map((name) =>
          join(repoRoot, dir, name, REPORT_PATH),
        )
      : [],
  )
    .filter((reportPath) => existsSync(reportPath))
    .flatMap((reportPath) =>
      readFileTimings(readFileSync(reportPath, 'utf8'), repoRoot),
    );

const git = (args) =>
  execFileSync('git', args, {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

const hasRef = (ref) => {
  try {
    git(['rev-parse', '--verify', '--quiet', `${ref}^{commit}`]);
    return true;
  } catch {
    return false;
  }
};

const readBaseAllowlist = (ref) => {
  try {
    return JSON.parse(git(['show', `${ref}:${ALLOWLIST_PATH}`]));
  } catch {
    return undefined;
  }
};

const main = () => {
  const enforce = process.argv.includes(ENFORCE_FLAG);
  const baseRef = process.env[BASE_REF_VAR] || BASE_REF;
  const allowlist = JSON.parse(
    readFileSync(join(repoRoot, ALLOWLIST_PATH), 'utf8'),
  );
  const timings = readReports();

  const problems = [
    ...findOverBudget(timings, allowlist, DEFAULT_BUDGET_SECONDS).map(
      formatOverBudget,
    ),
    ...findMissingEntries(allowlist, (file) =>
      existsSync(join(repoRoot, file)),
    ).map(formatMissing),
  ];

  if (hasRef(baseRef)) {
    const baseAllowlist = readBaseAllowlist(baseRef);
    if (baseAllowlist) {
      problems.push(
        ...findAllowlistGrowth(baseAllowlist, allowlist).map((growth) =>
          formatGrowth(growth, baseRef),
        ),
      );
    }
  } else if (enforce) {
    problems.push(
      `base ref ${baseRef} not found, so ${ALLOWLIST_PATH} cannot be compared against it`,
    );
  }

  if (problems.length === 0) {
    console.log(formatPass(timings.length, Object.keys(allowlist).length));
    return;
  }

  const prefix = enforce ? '::error::' : 'warning: ';
  for (const problem of problems) console.log(`${prefix}${problem}`);
  if (enforce) process.exitCode = 1;
};

if (realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) main();
