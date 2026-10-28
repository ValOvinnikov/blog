import type { TLead } from '@blog/db/schema/leads';
import {
  decryptPersonalValue,
  emailColumns,
  encryptPersonalValue,
} from '@blog/db/utils/personal-data/personal-data';
import { personalDataIndex } from '@blog/utils/encryption';

export type TLeadContent = {
  name: string;
  email: string;
  message: string;
};

type TLeadContentColumns = Pick<
  TLead,
  'nameEncrypted' | 'emailEncrypted' | 'emailIndex' | 'messageEncrypted'
>;

export function leadContentColumns({
  name,
  email,
  message,
}: TLeadContent): TLeadContentColumns {
  return {
    nameEncrypted: encryptPersonalValue(name),
    ...emailColumns(email, personalDataIndex),
    messageEncrypted: encryptPersonalValue(message),
  };
}

export function readLeadContent({
  nameEncrypted,
  emailEncrypted,
  messageEncrypted,
}: Omit<TLeadContentColumns, 'emailIndex'>): TLeadContent {
  return {
    name: decryptPersonalValue(nameEncrypted),
    email: decryptPersonalValue(emailEncrypted),
    message: decryptPersonalValue(messageEncrypted),
  };
}
