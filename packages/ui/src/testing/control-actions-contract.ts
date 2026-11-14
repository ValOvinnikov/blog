import type { UserEvent } from '@testing-library/user-event';
import type { Mock } from 'vitest';

import { screen } from './custom-render';

type TControlAction<THandler extends string> = {
  control: string;
  label: string;
  handler: THandler;
  tabs: number;
};

type TControlActionsContract<THandler extends string> = {
  controls: readonly TControlAction<THandler>[];
  getUser: () => UserEvent;
  getHandlers: () => Record<THandler, Mock<() => void>>;
};

export const testControlActions = <THandler extends string>({
  controls,
  getUser,
  getHandlers,
}: TControlActionsContract<THandler>) => {
  it.each(controls)(
    'runs the $control action when clicked',
    async ({ label, handler }) => {
      const button = screen.getByRole('button', { name: label });

      await getUser().click(button);

      expect(getHandlers()[handler]).toHaveBeenCalledTimes(1);
    },
  );

  it.each(controls)(
    'runs the $control action when activated by keyboard',
    async ({ handler, tabs }) => {
      for (let i = 0; i < tabs; i++) {
        await getUser().tab();
      }
      await getUser().keyboard('{Enter}');

      expect(getHandlers()[handler]).toHaveBeenCalledTimes(1);
    },
  );
};
