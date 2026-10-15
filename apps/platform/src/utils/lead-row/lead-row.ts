import type { TLead } from '@blog/db/schema/leads';

export type TLeadRow = Pick<
  TLead,
  'id' | 'name' | 'email' | 'message' | 'sourcePath' | 'createdAt'
>;

export const toLeadRow = ({
  id,
  name,
  email,
  message,
  sourcePath,
  createdAt,
}: TLead): TLeadRow => ({ id, name, email, message, sourcePath, createdAt });
