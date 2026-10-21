import { createHash } from 'node:crypto';

export const SHA256_ALGORITHM = 'sha256';
export const HEX_ENCODING = 'hex';

export const hashSha256Hex = (value: string): string =>
  createHash(SHA256_ALGORITHM).update(value).digest(HEX_ENCODING);
