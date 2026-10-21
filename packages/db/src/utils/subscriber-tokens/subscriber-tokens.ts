import { hashToken } from '@blog/utils/hash-token';

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
      confirmationTokenHash: hashToken(confirmationToken),
      unsubscribeTokenHash: hashToken(unsubscribeToken),
    },
  };
}
