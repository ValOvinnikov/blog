import { Select as BaseSelect } from '@base-ui/react/select';
import { selectVariants } from '@platform/components/shared/select/select-variants';
import type { ReactNode } from 'react';

export type TSelectPopupProps = {
  children: ReactNode;
};

export const SelectPopup = ({ children }: TSelectPopupProps) => {
  const { popup } = selectVariants();

  return (
    <BaseSelect.Portal>
      <BaseSelect.Positioner sideOffset={4} alignItemWithTrigger={false}>
        <BaseSelect.Popup className={popup()}>
          <BaseSelect.List>{children}</BaseSelect.List>
        </BaseSelect.Popup>
      </BaseSelect.Positioner>
    </BaseSelect.Portal>
  );
};
