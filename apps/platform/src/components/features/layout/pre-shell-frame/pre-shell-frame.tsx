import { Card } from '@platform/components/shared/card';
import type { ReactNode } from 'react';

import { preShellFrameVariants } from './pre-shell-frame-variants';

export type TPreShellFrameProps = {
  children: ReactNode;
};

/** The page frame for routes that render before `AdminShell` exists. */
export const PreShellFrame = ({ children }: TPreShellFrameProps) => {
  const { root, main } = preShellFrameVariants();

  return (
    <div className={root()}>
      <main className={main()}>
        <Card>
          <Card.Body>{children}</Card.Body>
        </Card>
      </main>
    </div>
  );
};
