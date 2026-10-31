import type { TMaybeUndefined } from '@blog/config/types';
import { isUndefined } from '@blog/utils/primitives';

type TArrayMember = { _type?: unknown };

export const validateArrayTypeAtMostOnce =
  (type: string, message: string) =>
  (members: TMaybeUndefined<TArrayMember[]>): string | true => {
    if (isUndefined(members)) {
      return true;
    }

    const count = members.filter((member) => member._type === type).length;

    return count > 1 ? message : true;
  };
