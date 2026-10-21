import { createHash } from 'node:crypto';

export const DIGEST_ALGORITHM = 'sha256';
export const DIGEST_ENCODING = 'hex';

export const hashToken = (token: string): string =>
  createHash(DIGEST_ALGORITHM).update(token).digest(DIGEST_ENCODING);
