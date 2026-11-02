import type { TMaybeUndefined } from '@blog/config';
import { isUndefined } from '@blog/utils/primitives';

export type TAccordionOpenProps<TValue extends string> =
  | {
      multiple?: false;
      openValue: TMaybeUndefined<TValue>;
      onOpenValueChange: (value: TMaybeUndefined<TValue>) => void;
    }
  | {
      multiple: true;
      openValues: readonly TValue[];
      onOpenValuesChange: (values: TValue[]) => void;
    };

export const useAccordionOpenValues = <TValue extends string>(
  props: TAccordionOpenProps<TValue>,
) => {
  if (props.multiple) {
    return {
      isMultiple: true,
      openValues: props.openValues,
      setOpenValues: props.onOpenValuesChange,
    };
  }

  const { openValue, onOpenValueChange } = props;

  return {
    isMultiple: false,
    openValues: isUndefined(openValue) ? [] : [openValue],
    setOpenValues: (next: TValue[]) => onOpenValueChange(next.at(-1)),
  };
};
