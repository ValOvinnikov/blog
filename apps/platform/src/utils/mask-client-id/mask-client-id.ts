import {
  CLIENT_ID_MASK,
  MASKED_CLIENT_ID_LENGTH,
} from '@platform/constants/sign-in-apps';

export const maskClientId = (clientId: string) =>
  `${clientId.slice(0, MASKED_CLIENT_ID_LENGTH)}${CLIENT_ID_MASK}`;
