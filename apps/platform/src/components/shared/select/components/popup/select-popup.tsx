import { Select as BaseSelect } from '@base-ui/react/select';
import { menuSurfaceVariants } from '@platform/components/shared/menu-surface';
import { selectVariants } from '@platform/components/shared/select/select-variants';
import type { ReactNode } from 'react';

export type TSelectPopupProps = {
  children: ReactNode;
};

export const SelectPopup = ({ children }: TSelectPopupProps) => {
  const { popup } = selectVariants();
  const { positioner } = menuSurfaceVariants();

  return (
    <BaseSelect.Portal>
      <BaseSelect.Positioner
        sideOffset={4}
        alignItemWithTrigger={false}
        className={positioner()}
      >
        <BaseSelect.Popup className={popup()}>
          <BaseSelect.List>{children}</BaseSelect.List>
        </BaseSelect.Popup>
      </BaseSelect.Positioner>
    </BaseSelect.Portal>
  );
};
