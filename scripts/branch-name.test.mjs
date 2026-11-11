import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { branchName, isAllowedBranch, renameHint } from './branch-name.mjs';

const ISSUE = 3952;
const TITLE = 'feat(studio): a Team may have a single member';
const TICKET_BRANCH = 'feat/3952-a-team-may-have-a-single';
const GENERATED_BRANCH = 'claude/issue-123-abc123';

describe('branchName', () => {
  it('builds <type>/<n>-<slug> from the first six words of the subject', () => {
    assert.equal(branchName(ISSUE, TITLE), TICKET_BRANCH);
  });

  it('drops punctuation and backticks from the subject', () => {
    assert.equal(
      branchName(7115, 'tooling(claude): enforce `ticket-named` branches!'),
      'tooling/7115-enforce-ticket-named-branches',
    );
  });

  it('accepts a title without a scope', () => {
    assert.equal(branchName(1, 'fix: broken link'), 'fix/1-broken-link');
  });

  it('builds a name the pattern accepts', () => {
    assert.ok(isAllowedBranch(branchName(ISSUE, TITLE)));
  });

  it('refuses a type commitlint does not allow', () => {
    assert.throws(() => branchName(ISSUE, 'feature(studio): x'), /commitlint/);
  });

  it('refuses a title that is not conventional-commit shaped', () => {
    assert.throws(() => branchName(ISSUE, 'A Team may have one member'));
  });

  it('refuses something other than an issue number', () => {
    assert.throws(() => branchName('abc', TITLE), /issue number/);
  });
});

describe('isAllowedBranch', () => {
  it('accepts ticket branches, main and dependabot', () => {
    for (const name of [
      TICKET_BRANCH,
      'tooling/7115-x',
      'main',
      'dependabot/npm_and_yarn/next-16.1.0',
    ]) {
      assert.ok(isAllowedBranch(name), name);
    }
  });

  it('refuses generated, ticketless and malformed names', () => {
    for (const name of [
      GENERATED_BRANCH,
      'claude/optimistic-noether-isuljn',
      'tooling/branch-name-push-guard',
      'feature/12-x',
      'feat/12-Upper-Case',
      'feat/12-',
      'feat/0-x',
      'worktree-agent-abc',
    ]) {
      assert.ok(!isAllowedBranch(name), name);
    }
  });
});

describe('renameHint', () => {
  it('carries the issue number found in the refused name', () => {
    assert.match(
      renameHint(GENERATED_BRANCH),
      /git branch -m "\$\(pnpm -s branch:name 123 "<title>"\)"/,
    );
  });

  it('falls back to a placeholder when the name has no number', () => {
    assert.match(renameHint('claude/eager-wozniak'), /branch:name <n> /);
  });
});
