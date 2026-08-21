import { execFileSync } from 'node:child_process';

export type TExecFn = (
  command: string,
  args: string[],
  options: { cwd: string; env: NodeJS.ProcessEnv },
) => void;

// Thin, mockable wrapper around `execFileSync` — `deps.exec` in
// `steps/create-studio-vercel-project.ts` swaps this for a spy in tests.
// eslint-disable-next-line func-style -- swappable TExecFn value, not an operation export
export const defaultExec: TExecFn = (command, args, options) => {
  execFileSync(command, args, { ...options, stdio: 'inherit' });
};
