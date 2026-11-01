'use client';

import { Select as BaseSelect } from '@base-ui/react/select';
import { SelectItem } from '@platform/components/shared/select/components/item/select-item';
import { SelectItemText } from '@platform/components/shared/select/components/item-text/select-item-text';
import { SelectPopup } from '@platform/components/shared/select/components/popup/select-popup';
import { SelectTrigger } from '@platform/components/shared/select/components/trigger/select-trigger';
import type { TCompoundComponent } from '@platform/lib/react';
import type { ElementType, ReactNode } from 'react';

const SelectParts = {
  Trigger: SelectTrigger,
  Popup: SelectPopup,
  Item: SelectItem,
  ItemText: SelectItemText,
} satisfies Record<string, ElementType>;

type TSelectProps<TValue extends string> = {
  value: TValue;
  onChange: (value: TValue) => void;
  isDisabled?: boolean;
  isLocked?: boolean;
  children: ReactNode;
};

const SelectRoot = <TValue extends string>({
  value,
  onChange,
  isDisabled = false,
  isLocked = false,
  children,
}: TSelectProps<TValue>) => (
  <BaseSelect.Root<TValue>
    value={value}
    onValueChange={(next) => {
      if (!isLocked && next !== null) onChange(next);
    }}
    onOpenChange={(isOpening, eventDetails) => {
      if (isLocked && isOpening) eventDetails.cancel();
    }}
    disabled={isDisabled}
  >
    {children}
  </BaseSelect.Root>
);

export const Select: TCompoundComponent<typeof SelectRoot, typeof SelectParts> =
  Object.assign(SelectRoot, SelectParts);
