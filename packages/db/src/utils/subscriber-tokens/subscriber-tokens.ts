import { sha256Hex } from '@blog/utils/hash';

export interface IConfirmationToken {
  confirmationToken: string;
  confirmationTokenHash: string;
}

export function mintConfirmationToken(): IConfirmationToken {
  const confirmationToken = crypto.randomUUID();

  return {
    confirmationToken,
    confirmationTokenHash: sha256Hex(confirmationToken),
  };
}
