import { joinIds } from '@platform/utils/join-ids/join-ids';
import type { TMaybeUndefined } from '@shinefold/config';
import { useId } from 'react';

type TDescribedOption = {
  value: string;
  description?: string;
};

export const useSelectedDescription = (
  options: TDescribedOption[],
  value: string,
  describedBy: TMaybeUndefined<string>,
) => {
  const descriptionId = useId();
  const description = options.find(
    ({ value: optionValue }) => optionValue === value,
  )?.description;

  return {
    descriptionId,
    description,
    groupDescribedBy: joinIds(describedBy, description && descriptionId),
  };
};
