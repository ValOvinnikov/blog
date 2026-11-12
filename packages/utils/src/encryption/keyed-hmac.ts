import { createHmac } from 'node:crypto';

import { SHA256_ALGORITHM } from '@blog/utils/hash';

import { KEY_ENCODING, PAYLOAD_ENCODING } from './crypto-encoding';

export function keyedHmac(value: string, keyBase64: string): string {
  return createHmac(SHA256_ALGORITHM, Buffer.from(keyBase64, KEY_ENCODING))
    .update(value)
    .digest(PAYLOAD_ENCODING);
}
