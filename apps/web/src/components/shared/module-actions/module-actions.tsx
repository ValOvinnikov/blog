import type { TContentAlignment, TMaybeUndefined } from '@blog/config';
import { hasLength } from '@blog/utils/primitives';
import { ActionGroup } from '@web/components/shared/action-group';
import type { IActionGroupProps } from '@web/components/shared/action-group/action-group';
import { moduleGridActionsVariants } from '@web/utils/module-grid-actions-variants';

export interface IModuleActionsProps {
  actions: IActionGroupProps['actions'];
  align: TMaybeUndefined<TContentAlignment>;
}

export const ModuleActions = ({ actions, align }: IModuleActionsProps) => {
  if (!hasLength(actions)) return null;

  const s = moduleGridActionsVariants({ align });

  return (
    <div className={s.actions()}>
      <ActionGroup actions={actions} />
    </div>
  );
};
