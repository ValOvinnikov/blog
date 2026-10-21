import { sha256Hex } from '@blog/utils/hash';

export interface ISubscriberTokens {
  confirmationToken: string;
  unsubscribeToken: string;
}

export interface ISubscriberTokenHashes {
  confirmationTokenHash: string;
  unsubscribeTokenHash: string;
}

export function mintSubscriberTokens(): {
  tokens: ISubscriberTokens;
  hashes: ISubscriberTokenHashes;
} {
  const confirmationToken = crypto.randomUUID();
  const unsubscribeToken = crypto.randomUUID();

  return {
    tokens: { confirmationToken, unsubscribeToken },
    hashes: {
      confirmationTokenHash: sha256Hex(confirmationToken),
      unsubscribeTokenHash: sha256Hex(unsubscribeToken),
    },
  };
}
