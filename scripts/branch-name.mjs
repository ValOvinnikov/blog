import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

import commitlintConfig from '../commitlint.config.mjs';

const BRANCH_TYPES = commitlintConfig.rules['type-enum'][2];

export const BRANCH_NAME_PATTERN = new RegExp(
  `^(${BRANCH_TYPES.join('|')})/[1-9][0-9]*-[a-z0-9]+(-[a-z0-9]+)*$`,
);

const EXEMPT_BRANCH_PATTERN =
  /^(main|dependabot\/.+|claude\/issue-[1-9][0-9]*-[0-9]{8}-[0-9]{4})$/;
const SLUG_WORD_LIMIT = 6;
const TITLE_PATTERN = /^([a-z]+)(\([^)]*\))?!?:\s*(.+)$/;

export const isAllowedBranch = (name) =>
  BRANCH_NAME_PATTERN.test(name) || EXEMPT_BRANCH_PATTERN.test(name);

export const branchName = (issueNumber, title) => {
  if (!/^[1-9][0-9]*$/.test(String(issueNumber))) {
    throw new Error(`"${issueNumber}" is not an issue number.`);
  }
  const match = TITLE_PATTERN.exec(title.trim());
  if (!match) {
    throw new Error(
      `"${title}" is not a conventional-commit title ("<type>(<scope>): <subject>").`,
    );
  }
  const [, type, , subject] = match;
  if (!BRANCH_TYPES.includes(type)) {
    throw new Error(
      `"${type}" is not a commitlint type (${BRANCH_TYPES.join(', ')}).`,
    );
  }
  const words = subject
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, SLUG_WORD_LIMIT);
  if (words.length === 0) {
    throw new Error(`"${title}" has no words to build a slug from.`);
  }
  return `${type}/${issueNumber}-${words.join('-')}`;
};

export const renameHint = (name) => {
  const issueNumber = /(?:^|\D)([1-9][0-9]*)-/.exec(name)?.[1] ?? '<n>';
  return (
    `Branch "${name}" does not match <type>/<n>-<slug> ` +
    `(type one of: ${BRANCH_TYPES.join(', ')}).\n` +
    'Rename it from the ticket title, then push:\n' +
    `  git branch -m "$(pnpm -s branch:name ${issueNumber} "<title>")"\n`
  );
};

const NULL_SHA = /^0+$/;
const BRANCH_REF_PREFIX = 'refs/heads/';

export const branchesCreatedByPush = (prePushInput) =>
  prePushInput
    .split('\n')
    .map((line) => line.trim().split(/\s+/))
    .filter(
      ([, localSha, remoteRef, remoteSha]) =>
        remoteRef?.startsWith(BRANCH_REF_PREFIX) &&
        !NULL_SHA.test(localSha) &&
        NULL_SHA.test(remoteSha ?? ''),
    )
    .map(([, , remoteRef]) => remoteRef.slice(BRANCH_REF_PREFIX.length));

const check = (names) => {
  const rejected = names.filter((name) => !isAllowedBranch(name));
  rejected.forEach((name) => process.stderr.write(renameHint(name)));
  return rejected.length === 0 ? 0 : 1;
};

const run = (args) => {
  if (args[0] === '--check') return check(args.slice(1));
  if (args[0] === '--check-pre-push') {
    return check(branchesCreatedByPush(readFileSync(0, 'utf8')));
  }
  const [issueNumber, title] = args;
  if (issueNumber === undefined || title === undefined) {
    process.stderr.write(
      'Usage: pnpm branch:name <n> "<title>"\n' +
        '       pnpm branch:name --check <branch>...\n' +
        '       node scripts/branch-name.mjs --check-pre-push < <pre-push stdin>\n',
    );
    return 1;
  }
  try {
    process.stdout.write(`${branchName(issueNumber, title)}\n`);
    return 0;
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    return 1;
  }
};

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  process.exitCode = run(process.argv.slice(2));
}
