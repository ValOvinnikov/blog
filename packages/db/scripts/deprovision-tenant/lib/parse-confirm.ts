import { parseFlagValue } from '../../lib/cli-flags';

import { TOOL } from './tool';

const CONFIRM_FLAG = '--confirm=';

export function parseConfirm(argv: string[]): string {
  const value = parseFlagValue(argv, CONFIRM_FLAG) ?? process.env['CONFIRM'];
  if (!value) {
    throw new Error(
      `${TOOL}: missing required ${CONFIRM_FLAG}<tenant-name> (or CONFIRM env var).`,
    );
  }
  return value;
}
